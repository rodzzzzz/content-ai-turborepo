import { z } from 'zod';

// Font category enum - standard CSS font-family generic names
export const fontCategoryEnum = z.enum([
    'Serif',
    'Sans Serif',
    'Monospace',
    'Cursive',
]);

export type FontCategory = z.infer<typeof fontCategoryEnum>;

// Additional colors schema - dynamic record of color name to color value
const additionalColorsSchema = z.record(z.string(), z.string());

// Simplified branding profile schema - for component use
export const brandingProfileSchema = z.object({
    primaryColor: z.string().optional(),
    additionalColors: additionalColorsSchema.optional(),
    font: fontCategoryEnum.optional(),
    logo: z.url().optional().or(z.literal('')),
    icon: z.url().optional().or(z.literal('')),
});

// Brand kit schema for saving/updating - matches Prisma schema
export const brandKitSchema = z.object({
    primaryColor: z.string().optional(),
    additionalColors: additionalColorsSchema.optional(),
    font: fontCategoryEnum.optional(),
    logo: z.url().optional().or(z.literal('')),
    icon: z.url().optional().or(z.literal('')),
});

// Extract branding schema for URL validation
export const extractBrandingSchema = z.object({
    url: z.url('Please enter a valid URL'),
});

export type BrandingProfile = z.infer<typeof brandingProfileSchema>;
