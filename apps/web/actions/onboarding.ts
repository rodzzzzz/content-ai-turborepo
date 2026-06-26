'use server';

import { getServerApiConfig } from '@/lib/server-api';
import { onboardingSchema } from '@/lib/validations/onboarding';
import { z } from 'zod';

export const onboarding = async (values: z.infer<typeof onboardingSchema>) => {
  const parsed = onboardingSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid fields' };
  }

  const v = parsed.data;

  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/onboarding/complete`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: v.firstName,
        lastName: v.lastName,
        timeZone: v.timeZone,
        organizationName: v.organizationName,
        organizationSize: v.organizationSize,
        organizationType: v.organizationType,
        discoveryChannel: v.discoveryChannel,
      }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data?.error ?? 'Something went wrong' };
    }
    if (data.error) {
      return { error: data.error };
    }

    return {
      success: 'User onboarding has been completed',
      organizationId: data.organizationId as string,
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};
