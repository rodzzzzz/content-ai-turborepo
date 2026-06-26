'use server';

import { getServerApiConfig } from '@/lib/server-api';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export const changeOrganization = async (organizationId: string) => {
  if (!organizationId?.trim()) {
    return { error: 'Organization id is required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(
      `${apiUrl}/api/organization/${encodeURIComponent(organizationId.trim())}/default`,
      {
        method: 'PATCH',
        headers: { cookie },
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return {
      success: 'Organization changed successfully',
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};

export const getOrganizations = async () => {
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/organization`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return {
      success: 'Organizations fetched successfully',
      organizations: data.organizations ?? [],
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};

export const getOrganizationById = async (id: string) => {
  if (!id?.trim()) {
    return { error: 'Organization id is required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(
      `${apiUrl}/api/organization/${encodeURIComponent(id.trim())}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return {
      success: 'Organization fetched successfully',
      organization: data.organization,
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};

export const createOrganization = async (name: string) => {
  if (!name?.trim()) {
    return { error: 'Organization name is required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/organization`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name.trim() }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return {
      success: 'Organization created successfully',
      organization: data.organization,
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};

export const updateOrganization = async (id: string, name: string) => {
  if (!id?.trim() || !name?.trim()) {
    return { error: 'Organization id and name are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(
      `${apiUrl}/api/organization/${encodeURIComponent(id.trim())}`,
      {
        method: 'PATCH',
        headers: {
          cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return {
      success: 'Organization updated successfully',
      organization: data.organization,
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};

export const deleteOrganization = async (id: string) => {
  if (!id?.trim()) {
    return { error: 'Organization id is required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(
      `${apiUrl}/api/organization/${encodeURIComponent(id.trim())}`,
      {
        method: 'DELETE',
        headers: { cookie },
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return {
      success: 'Organization deleted successfully',
    };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
};
