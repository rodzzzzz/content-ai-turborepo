'use server';

import { getServerApiConfig } from '@/lib/server-api';

export async function listKnowledgeBases(organizationId: string) {
  if (!organizationId?.trim()) return { error: 'organizationId is required' };
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    const res = await fetch(`${apiUrl}/api/knowledge-base?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, knowledgeBases: data.knowledgeBases ?? [] };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function getKnowledgeBase(organizationId: string, id: string) {
  if (!organizationId?.trim() || !id?.trim()) {
    return { error: 'organizationId and id are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    const res = await fetch(
      `${apiUrl}/api/knowledge-base/${encodeURIComponent(id.trim())}?${params}`,
      { headers: { cookie }, cache: 'no-store' },
    );
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, knowledgeBase: data.knowledgeBase };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function createKnowledgeBase(body: {
  organizationId: string;
  name: string;
  description?: string;
  tableData?: unknown;
  tableSchema?: unknown;
}) {
  if (!body.organizationId?.trim() || !body.name?.trim()) {
    return { error: 'organizationId and name are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/knowledge-base`, {
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
    return { success: true, knowledgeBase: data.knowledgeBase };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function updateKnowledgeBase(
  organizationId: string,
  id: string,
  patch: {
    name?: string;
    description?: string;
    vectorIds?: string[];
    tableData?: unknown;
    tableSchema?: unknown;
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
      `${apiUrl}/api/knowledge-base/${encodeURIComponent(id.trim())}?${params}`,
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
    return { success: true, knowledgeBase: data.knowledgeBase };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function deleteKnowledgeBase(organizationId: string, id: string) {
  if (!organizationId?.trim() || !id?.trim()) {
    return { error: 'organizationId and id are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    const res = await fetch(
      `${apiUrl}/api/knowledge-base/${encodeURIComponent(id.trim())}?${params}`,
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
