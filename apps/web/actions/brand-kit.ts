'use server';

import { currentUser } from '@/lib/auth';
import { getServerApiConfig } from '@/lib/server-api';
import { firecrawl } from '@/lib/firecrawl';
import {
  brandKitSchema,
  extractBrandingSchema,
  brandingProfileSchema,
  fontCategoryEnum,
} from '@/lib/validations/brand-kit';
import { mapFontToCategory } from '@/constants/font-categories';
import { UploadStatus } from '@prisma/client';
import { uploadImageFromUrlToUploadThing } from '@/lib/upload-from-url';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function createMediaFileRecord(input: {
  organizationId: string;
  name: string;
  url: string;
  key: string;
  fileType: string;
  fileSize: number;
  uploadStatus: UploadStatus;
}) {
  const { apiUrl, cookie } = await getServerApiConfig();
  const res = await fetch(`${apiUrl}/api/media/files`, {
    method: 'POST',
    headers: {
      cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: input.organizationId,
      name: input.name,
      url: input.url,
      key: input.key,
      fileType: input.fileType,
      fileSize: input.fileSize,
      uploadStatus: input.uploadStatus,
    }),
    cache: 'no-store',
  });
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    throw new Error(data?.error ?? 'Failed to create file record');
  }
  return data.file;
}

/**
 * Download image from URL and upload to UploadThing
 */
async function uploadImageFromUrl(
  imageUrl: string,
  baseUrl?: string,
): Promise<string | null> {
  try {
    const user = await currentUser();

    if (!user?.id || !user.organizationId) {
      throw new Error('Unauthorized');
    }

    const uploadResult = await uploadImageFromUrlToUploadThing(
      imageUrl,
      baseUrl,
    );

    if (!uploadResult) {
      return null;
    }

    await createMediaFileRecord({
      organizationId: user.organizationId,
      key: uploadResult.key,
      url: uploadResult.url,
      name: uploadResult.name,
      uploadStatus: UploadStatus.SUCCESS,
      fileType: uploadResult.type,
      fileSize: uploadResult.size,
    });

    return uploadResult.url;
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    return null;
  }
}

export async function getBrandKit() {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(`${apiUrl}/api/brand-kit?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Failed to fetch brand kit' };
    if (data.error) return { error: data.error };

    return {
      success: true,
      data: data.brandKit,
    };
  } catch (error) {
    console.error('Error fetching brand kit:', error);
    return { error: 'Failed to fetch brand kit' };
  }
}

export async function extractBrandingFromWebsite(url: string) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { url: validatedUrl } = extractBrandingSchema.parse({ url });

    const scrapedData = await firecrawl.scrape(validatedUrl, {
      formats: [
        {
          type: 'branding',
        },
      ],
    });

    if (!scrapedData.branding) {
      return {
        error: 'No branding information found on the website',
      };
    }

    const firecrawlBranding = scrapedData.branding as {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
        textPrimary?: string;
        textSecondary?: string;
      };
      logo?: string;
      typography?: { fontFamilies?: { primary?: string } };
      images?: {
        logo?: string;
        icon?: string;
      };
    };

    const brandingData: {
      primaryColor?: string;
      additionalColors?: Record<string, string>;
      font?: string;
      logo?: string;
      icon?: string;
    } = {};

    if (firecrawlBranding.colors) {
      brandingData.primaryColor = firecrawlBranding.colors.primary;

      const additionalColors: Record<string, string> = {};

      const colorMapping: Record<string, string> = {
        secondary: 'Secondary',
        accent: 'Accent',
        background: 'Background',
        textPrimary: 'Text Primary',
        textSecondary: 'Text Secondary',
      };

      Object.entries(firecrawlBranding.colors).forEach(([key, value]) => {
        if (key !== 'primary' && value) {
          const colorName = colorMapping[key] || key;
          additionalColors[colorName] = value;
        }
      });

      if (Object.keys(additionalColors).length > 0) {
        brandingData.additionalColors = additionalColors;
      }
    }

    if (firecrawlBranding.typography?.fontFamilies?.primary) {
      const primaryFont =
        firecrawlBranding.typography.fontFamilies.primary;

      if (primaryFont) {
        const category = mapFontToCategory(primaryFont);
        const validatedCategory = fontCategoryEnum.safeParse(category);
        brandingData.font = validatedCategory.success
          ? validatedCategory.data
          : 'Sans Serif';
      }
    }

    let logoUrl: string | undefined;
    let iconUrl: string | undefined;

    if (firecrawlBranding.logo) {
      logoUrl = firecrawlBranding.logo;
    } else if (firecrawlBranding.images?.logo) {
      logoUrl = firecrawlBranding.images.logo;
    }

    if (firecrawlBranding.images?.icon) {
      iconUrl = firecrawlBranding.images.icon;
    }

    if (logoUrl) {
      const uploadedLogoUrl = await uploadImageFromUrl(
        logoUrl,
        validatedUrl,
      );
      if (uploadedLogoUrl) {
        brandingData.logo = uploadedLogoUrl;
      }
    }

    if (iconUrl) {
      const uploadedIconUrl = await uploadImageFromUrl(
        iconUrl,
        validatedUrl,
      );
      if (uploadedIconUrl) {
        brandingData.icon = uploadedIconUrl;
      }
    }

    const validatedBrandingData = brandingProfileSchema.parse(brandingData);

    return {
      success: true,
      data: validatedBrandingData,
    };
  } catch (error) {
    console.error('Error extracting branding:', error);

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: 'Failed to extract branding from website' };
  }
}

export async function saveBrandKit(data: {
  primaryColor?: string;
  additionalColors?: unknown;
  font?: string;
  logo?: string;
  icon?: string;
}) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const validatedData = brandKitSchema.parse(data);

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/brand-kit`, {
      method: 'PUT',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        primaryColor: validatedData.primaryColor || undefined,
        additionalColors: validatedData.additionalColors || undefined,
        font: validatedData.font || undefined,
        logo:
          validatedData.logo && validatedData.logo !== ''
            ? validatedData.logo
            : undefined,
        icon:
          validatedData.icon && validatedData.icon !== ''
            ? validatedData.icon
            : undefined,
      }),
      cache: 'no-store',
    });
    const result = await parseJson(res);
    if (!res.ok) return { error: result?.error ?? 'Failed to save brand kit' };
    if (result.error) return { error: result.error };

    return {
      success: true,
      data: result.brandKit,
    };
  } catch (error) {
    console.error('Error saving brand kit:', error);

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: 'Failed to save brand kit' };
  }
}
