'use server';

import { getServerApiConfig } from '@/lib/server-api';

export async function listAnalytics(
  organizationId: string,
  integrationId: string,
  platform: 'facebook' | 'twitter' | 'linkedin',
  range?: { from?: string; to?: string },
) {
  if (!organizationId?.trim() || !integrationId?.trim()) {
    return { error: 'organizationId and integrationId are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
      integrationId: integrationId.trim(),
      platform,
    });
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);
    const res = await fetch(`${apiUrl}/api/analytics?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, analytics: data.analytics ?? [] };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}
