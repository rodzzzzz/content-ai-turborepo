'use server';

import { getServerApiConfig } from '@/lib/server-api';

export async function listFolders(organizationId: string) {
  if (!organizationId?.trim()) return { error: 'organizationId is required' };
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    const res = await fetch(`${apiUrl}/api/media/folders?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, folders: data.folders ?? [] };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function listFiles(organizationId: string, folderId?: string) {
  if (!organizationId?.trim()) return { error: 'organizationId is required' };
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: organizationId.trim(),
    });
    if (folderId) params.set('folderId', folderId);
    const res = await fetch(`${apiUrl}/api/media/files?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, files: data.files ?? [] };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function createFolder(body: { organizationId: string; name: string }) {
  if (!body.organizationId?.trim() || !body.name?.trim()) {
    return { error: 'organizationId and name are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/media/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        organizationId: body.organizationId.trim(),
        name: body.name.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };
    return { success: true, folder: data.folder };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}

export async function createFile(body: {
  organizationId: string;
  name: string;
  url: string;
  key: string;
  fileType: string;
  fileSize: number;
  folderId?: string;
}) {
  if (
    !body.organizationId?.trim() ||
    !body.name?.trim() ||
    !body.url?.trim() ||
    !body.key?.trim()
  ) {
    return { error: 'organizationId, name, url, and key are required' };
  }
  try {
    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/media/files`, {
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
    return { success: true, file: data.file };
  } catch (error) {
    console.error(error);
    return { error: 'Something went wrong' };
  }
}
