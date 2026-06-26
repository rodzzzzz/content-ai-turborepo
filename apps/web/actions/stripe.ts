'use server';

import { getServerApiConfig } from '@/lib/server-api';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function createCheckoutSession(
  priceId: string,
  customerId?: string,
) {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/billing/checkout-session`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, customerId }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) {
      throw new Error(data?.error ?? 'Failed to create checkout session');
    }
    if (data.error) {
      throw new Error(data.error);
    }
    return data as { url: string };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function createCustomerPortalSession(
  stripeCustomerId: string,
  stripeProductId: string,
) {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/billing/customer-portal`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stripeCustomerId, stripeProductId }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) {
      throw new Error(data?.error ?? 'Failed to create portal session');
    }
    if (data.error) {
      throw new Error(data.error);
    }
    return data as {
      url: string;
      id: string;
      created: number;
      customer: unknown;
      return_url: string | null;
    };
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

export type UpdateSubscriptionResult =
  | { success: true; message?: string; scheduledDate?: string }
  | { success: false; error: string; organizationsCount?: number };

export async function updateSubscription(
  newPriceId: string,
): Promise<UpdateSubscriptionResult> {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/billing/update-subscription`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newPriceId }),
      cache: 'no-store',
    });
    const data = (await parseJson(res)) as Record<string, unknown>;
    if (data.error && typeof data.error === 'string') {
      return {
        success: false,
        error: data.error,
        organizationsCount:
          typeof data.organizationsCount === 'number'
            ? data.organizationsCount
            : undefined,
      };
    }
    return {
      success: true,
      message:
        typeof data.message === 'string' ? data.message : undefined,
      scheduledDate:
        typeof data.scheduledDate === 'string'
          ? data.scheduledDate
          : data.scheduledDate instanceof Date
            ? data.scheduledDate.toISOString()
            : undefined,
    };
  } catch (error) {
    console.error('Error updating subscription:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update subscription';
    return { success: false, error: errorMessage };
  }
}

export type CancelDowngradeResult =
  | { success: true; message?: string }
  | { success: false; error?: string };

export async function cancelDowngrade(): Promise<CancelDowngradeResult> {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/billing/cancel-downgrade`, {
      method: 'POST',
      headers: { cookie },
      cache: 'no-store',
    });
    const data = (await parseJson(res)) as Record<string, unknown>;
    if (data.success === false) {
      return {
        success: false,
        error:
          typeof data.error === 'string' ? data.error : 'Request failed',
      };
    }
    return {
      success: true,
      message: typeof data.message === 'string' ? data.message : undefined,
    };
  } catch (error) {
    console.error('Error cancelling downgrade:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to cancel downgrade';
    return { success: false, error: errorMessage };
  }
}
