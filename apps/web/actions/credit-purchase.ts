'use server';

import { getServerApiConfig } from '@/lib/server-api';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function createCreditPurchaseSession(amount: number) {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/billing/credit-purchase-session`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) {
      throw new Error(data?.error ?? 'Failed to create credit purchase session');
    }
    if (data.error) {
      throw new Error(data.error);
    }
    return data as { url: string };
  } catch (error) {
    console.error('Error creating credit purchase session:', error);
    throw error;
  }
}

/**
 * Legacy: success is handled by Nest `GET /api/stripe/credit-purchase-success`.
 * Kept for any code that still imports this name.
 */
export async function handleCreditPurchaseSuccess(_sessionId: string) {
  return { success: true as const };
}
