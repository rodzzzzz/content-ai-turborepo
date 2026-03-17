'use server';

import { headers } from 'next/headers';
import { onboardingSchema } from '@/lib/validations/onboarding';
import type { z } from 'zod';

export async function onboarding(values: z.infer<typeof onboardingSchema>) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';

  const res = await fetch(`${apiUrl}/api/onboarding/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
    body: JSON.stringify(values),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      error: data?.error ?? 'Failed to complete onboarding',
    };
  }

  if (data.error) {
    return { error: data.error };
  }

  if (data.organizationId) {
    return {
      success: true,
      organizationId: data.organizationId,
    };
  }

  return { error: 'Invalid response from server' };
}
