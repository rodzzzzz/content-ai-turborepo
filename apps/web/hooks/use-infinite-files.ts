'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getInfiniteFiles } from '@/actions/file';
import { File as FileType } from '@prisma/client';

interface UseInfiniteFilesOptions {
    limit?: number;
    folderId?: string | null;
    search?: string;
    enabled?: boolean;
}

interface FilesResponse {
    success?: string;
    error?: string;
    files: FileType[];
    hasNextPage: boolean;
    nextCursor?: string;
}

export function useInfiniteFiles({
    limit = 20,
    folderId,
    search,
    enabled = true,
}: UseInfiniteFilesOptions = {}) {
    return useInfiniteQuery({
        queryKey: ['files', { folderId, search }],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            const response = await getInfiniteFiles({
                limit,
                cursor: pageParam,
                folderId,
                search,
            });

            if (response.error) {
                console.error('Error fetching files:', response.error);
                throw new Error(response.error);
            }

            // Ensure the response has the expected shape
            return {
                ...response,
                files: response.files || [], // Ensure files is an array even if undefined
                hasNextPage: !!response.hasNextPage,
                nextCursor: response.nextCursor,
            } as FilesResponse;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        refetchOnWindowFocus: false,
    });
}
