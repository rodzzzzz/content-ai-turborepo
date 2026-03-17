'use server';

import { headers } from 'next/headers';

const getApiConfig = async () => {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
  const headersList = await headers();
  const cookie = headersList.get('cookie') ?? '';
  return { apiUrl, cookie };
};

export async function getOrganizations() {
  try {
    const { apiUrl, cookie } = await getApiConfig();
    const res = await fetch(`${apiUrl}/api/organization`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();

    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, organizations: data.organizations ?? [] };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function getOrganizationById(id: string) {
  try {
    const { apiUrl, cookie } = await getApiConfig();
    const res = await fetch(`${apiUrl}/api/organization/${id}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();

    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, organization: data.organization };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function createOrganization(name: string) {
  try {
    const { apiUrl, cookie } = await getApiConfig();
    const res = await fetch(`${apiUrl}/api/organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, organization: data.organization };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function updateOrganization(id: string, name: string) {
  try {
    const { apiUrl, cookie } = await getApiConfig();
    const res = await fetch(`${apiUrl}/api/organization/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, organization: data.organization };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function deleteOrganization(id: string) {
  try {
    const { apiUrl, cookie } = await getApiConfig();
    const res = await fetch(`${apiUrl}/api/organization/${id}`, {
      method: 'DELETE',
      headers: { cookie },
    });
    const data = await res.json();

    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}