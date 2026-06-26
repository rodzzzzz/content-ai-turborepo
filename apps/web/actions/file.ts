'use server';

import { currentUser } from '@/lib/auth';
import { getServerApiConfig } from '@/lib/server-api';
import {
  fileRenameSchema,
  folderCreateSchema,
  folderUpdateSchema,
} from '@/lib/validations/file';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function getInitialFiles(filter: Prisma.FileWhereInput) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const urls = (filter as { url?: { in?: string[] } }).url?.in;
    if (!urls?.length) {
      return { error: 'Invalid filter' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/media/files/lookup-by-urls`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        urls,
      }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return { success: 'Files fetched successfully', files: data.files ?? [] };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function getInfiniteFiles(params?: {
  limit?: number;
  cursor?: string;
  folderId?: string | null;
  search?: string;
}) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { limit = 20, cursor, folderId, search } = params || {};

    const { apiUrl, cookie } = await getServerApiConfig();
    const q = new URLSearchParams({
      organizationId: user.organizationId,
      limit: String(limit),
    });
    if (cursor) q.set('cursor', cursor);
    if (search) q.set('search', search);
    if (folderId !== undefined && folderId !== null) {
      q.set('folderId', folderId);
    }

    const res = await fetch(`${apiUrl}/api/media/files?${q}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return {
      success: 'Files fetched successfully',
      files: data.files ?? [],
      hasNextPage: data.hasNextPage ?? false,
      nextCursor: data.nextCursor,
    };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function getFileById(id: string) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(
      `${apiUrl}/api/media/files/${encodeURIComponent(id)}?${params}`,
      {
        headers: { cookie },
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    if (!data.file) {
      return { error: 'File not found' };
    }

    return { success: 'File fetched successfully', file: data.file };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function renameFile(
  id: string,
  values: z.infer<typeof fileRenameSchema>,
) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(
      `${apiUrl}/api/media/files/${encodeURIComponent(id)}?${params}`,
      {
        method: 'PATCH',
        headers: {
          cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          folderId: values.folderId,
        }),
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return { success: 'File updated successfully', file: data.file };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function moveFiles(
  files: { id: string; key: string }[],
  destinationFolderId: string | 'HOME',
) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/media/files/bulk-move`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        files,
        destinationFolderId,
      }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return {
      success: 'Files moved successfully',
      movedFiles: data.movedFiles ?? [],
    };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function deleteFiles(files: { id: string; key: string }[]) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/media/files/delete-bulk`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        files,
      }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return { success: 'Files deleted successfully' };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function getFolders() {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(`${apiUrl}/api/media/folders?${params}`, {
      headers: { cookie },
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return { success: 'Folders fetched successfully', folders: data.folders ?? [] };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function createFolder(values: z.infer<typeof folderCreateSchema>) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/media/folders`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: values.name,
        organizationId: user.organizationId,
      }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return { success: 'Folder created successfully', folder: data.folder };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function updateFolder(
  folderId: string,
  values: z.infer<typeof folderUpdateSchema>,
) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(
      `${apiUrl}/api/media/folders/${encodeURIComponent(folderId)}?${params}`,
      {
        method: 'PATCH',
        headers: {
          cookie,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: values.name }),
        cache: 'no-store',
      },
    );
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return { success: 'Folder updated successfully', folder: data.folder };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function deleteFolder(id: string) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const params = new URLSearchParams({
      organizationId: user.organizationId,
    });
    const res = await fetch(
      `${apiUrl}/api/media/folders/${encodeURIComponent(id)}?${params}`,
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
      success: 'Folder deleted successfully',
    };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function uploadFile(files: File[], folderId?: string | null) {
  try {
    const user = await currentUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    return { success: 'Files uploaded successfully' };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}

export async function updateFileFolders(
  fileIds: string[],
  folderId: string | null,
) {
  try {
    const user = await currentUser();

    if (!user?.organizationId) {
      return { error: 'Unauthorized' };
    }

    const { apiUrl, cookie } = await getServerApiConfig();
    const res = await fetch(`${apiUrl}/api/media/files/update-folders`, {
      method: 'POST',
      headers: {
        cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        fileIds,
        folderId,
      }),
      cache: 'no-store',
    });
    const data = await parseJson(res);
    if (!res.ok) return { error: data?.error ?? 'Something went wrong' };
    if (data.error) return { error: data.error };

    return {
      success: 'Files updated successfully',
      count: data.count,
    };
  } catch (error) {
    return { error: 'Something went wrong' };
  }
}
