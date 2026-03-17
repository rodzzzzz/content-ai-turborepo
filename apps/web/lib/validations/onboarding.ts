import { z } from 'zod';

export const onboardingSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z
    .string()
    .min(2, { message: 'Last name must be at least 2 characters' }),
  timeZone: z.string().min(1, { message: 'Please select your time zone' }),
  organizationName: z
    .string()
    .min(2, { message: 'Organization name is required' }),
  organizationSize: z
    .string()
    .min(1, { message: 'Please select organization size' }),
  organizationType: z
    .string()
    .min(1, { message: 'Please select organization type' }),
  discoveryChannel: z
    .string()
    .min(1, { message: 'Please select how you found us' }),
});
