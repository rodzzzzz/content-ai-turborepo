import { z } from 'zod';

export const interestSchema = z.object({
    interests: z
        .array(
            z.object({
                value: z.string().min(1, 'Interest cannot be empty'),
            }),
        )
        .optional(),
});

export const personalitySchema = z.object({
    personality: z.string(),
    writingStyle: z.string(),
    additionalInstructions: z.string().optional(),
    emoji: z.boolean(),
    temperature: z.number().min(0).max(100),
});

export const platformGuidelinesSchema = z.object({
    twitter: z.string().nullish(),
    linkedin: z.string().nullish(),
    facebook: z.string().nullish(),
});

export type PersonalityFormValues = z.infer<typeof personalitySchema>;
export type InterestFormValues = z.infer<typeof interestSchema>;
export type PlatformGuidelinesFormValues = z.infer<
    typeof platformGuidelinesSchema
>;
