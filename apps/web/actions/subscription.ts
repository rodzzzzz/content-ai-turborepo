'use server';

import { getServerApiConfig } from '@/lib/server-api';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/**
 * Full subscription dashboard payload (replaces direct Prisma + getStripePrices on the page).
 */
export async function getSubscriptionPageData() {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/billing/subscription-page`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Unauthorized' };
    if (data.error) return { error: data.error };
    return data as {
      subscription: unknown;
      plans: unknown[];
      currentPlanPriceId?: string;
      scheduleInfo: {
        downgradeDate: string | null;
        targetPlanName: string | null;
      } | null;
      userTimeZone: string;
      userEmail: string | null;
    };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to load subscription' };
  }
}

export async function getSubscriptionData() {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/billing/subscription-data`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return data;
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      error: `Failed to fetch subscription data: ${errorMessage}`,
    };
  }
}
