import { getServerApiConfig } from '@/lib/server-api';
import type { UploadStatus } from '@prisma/client';

export async function createMediaFileViaApi(input: {
  organizationId: string;
  name: string;
  url: string;
  key: string;
  fileType: string;
  fileSize: number;
  folderId?: string | null;
  uploadStatus?: UploadStatus;
}) {
  const { apiUrl, cookie } = await getServerApiConfig();
  const res = await fetch(`${apiUrl}/api/media/files`, {
    method: 'POST',
    headers: {
      cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: input.organizationId,
      name: input.name,
      url: input.url,
      key: input.key,
      fileType: input.fileType,
      fileSize: input.fileSize,
      folderId: input.folderId ?? undefined,
      uploadStatus: input.uploadStatus,
    }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data?.error ?? 'Failed to create file');
  }
  return data.file as Record<string, unknown>;
}

export async function setUserAvatarViaApi(imageUrl: string) {
  const { apiUrl, cookie } = await getServerApiConfig();
  const res = await fetch(`${apiUrl}/api/users/me/avatar`, {
    method: 'PATCH',
    headers: {
      cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data?.error ?? 'Failed to update avatar');
  }
  return data;
}
