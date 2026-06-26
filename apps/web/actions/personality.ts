'use server';

import { currentUser } from '@/lib/auth';
import { getServerApiConfig } from '@/lib/server-api';
import {
  interestSchema,
  PersonalityFormValues,
  personalitySchema,
  platformGuidelinesSchema,
  PlatformGuidelinesFormValues,
} from '@/lib/validations/personality';
import { z } from 'zod';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getPersonality() {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(`${apiUrl}/api/personality?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Failed to get personality' };
    if (data.error) return { error: data.error };

    if (!data.personality) {
      return { error: 'Personality not found' };
    }

    return { success: true, data: data.personality };
  } catch (error) {
    console.error('Error getting personality:', error);
    return { error: 'Failed to get personality' };
  }
}

export async function updateInterests(data: z.infer<typeof interestSchema>) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const validatedData = interestSchema.parse(data);

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/personality`, {
      method: 'PUT',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        interests: validatedData.interests,
      }),
      cache: 'no-store',
    });
    const result = await parseJson(res);
    if (!res.ok) return { error: result?.error ?? 'Failed to update interests' };
    if (result.error) return { error: result.error };

    return { success: true, data: result.personality };
  } catch (error) {
    console.error('Error updating interests:', error);
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message ?? 'Validation error' };
    }
    return { error: 'Failed to update interests' };
  }
}

export async function updateWritingStyle(data: PersonalityFormValues) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const validatedData = personalitySchema.parse(data);

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/personality`, {
      method: 'PUT',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        personality: validatedData.personality,
        writingStyle: validatedData.writingStyle,
        additionalInstructions: validatedData.additionalInstructions,
        temperature: validatedData.temperature,
        emoji: validatedData.emoji,
      }),
      cache: 'no-store',
    });
    const result = await parseJson(res);
    if (!res.ok) {
      return {
        success: false,
        error: result?.error ?? 'Failed to update writing style preferences',
      };
    }
    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating writing style:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Failed to update writing style preferences',
    };
  }
}

export async function updatePlatformGuidelines(
  data: PlatformGuidelinesFormValues,
) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const validatedData = platformGuidelinesSchema.parse(data);

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/personality`, {
      method: 'PUT',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        twitter: validatedData.twitter,
        linkedin: validatedData.linkedin,
        facebook: validatedData.facebook,
      }),
      cache: 'no-store',
    });
    const result = await parseJson(res);
    if (!res.ok) {
      return {
        success: false,
        error: result?.error ?? 'Failed to update platform guidelines',
      };
    }
    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating platform guidelines:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Failed to update platform guidelines',
    };
  }
}
