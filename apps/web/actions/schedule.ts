'use server';

import { getServerApiConfig } from '@/lib/server-api';

export async function listSchedules(organizationId: string) {
  if (!organizationId?.trim()) return { error: 'organizationId is required' };
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    const res = await fetch(`${apiUrl}/api/schedule?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, schedules: data.schedules ?? [] };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function createSchedule(body: {
  organizationId: string;
  integrationId: string;
  platform: 'TWITTER' | 'LINKEDIN' | 'FACEBOOK';
  content: string;
  date: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  mediaUrl?: string[];
}) {
  if (
    !body.organizationId?.trim() ||
    !body.integrationId?.trim() ||
    !body.content?.trim()
  ) {
    return {
      error: 'organizationId, integrationId, and content are required',
    };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, schedule: data.schedule };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function updateSchedule(
  organizationId: string,
  id: string,
  patch: {
    platform?: 'TWITTER' | 'LINKEDIN' | 'FACEBOOK';
    content?: string;
    date?: string;
    status?: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    mediaUrl?: string[];
    integrationId?: string;
  },
) {
  if (!organizationId?.trim() || !id?.trim()) {
    return { error: 'organizationId and id are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    const res = await fetch(
      `${apiUrl}/api/schedule/${encodeURIComponent(id.trim())}?${params}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          cookie,
        },
        body: JSON.stringify(patch),
      },
    );
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, schedule: data.schedule };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function deleteSchedule(organizationId: string, id: string) {
  if (!organizationId?.trim() || !id?.trim()) {
    return { error: 'organizationId and id are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    const res = await fetch(
      `${apiUrl}/api/schedule/${encodeURIComponent(id.trim())}?${params}`,
      { method: 'DELETE', headers: { cookie } },
    );
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}
