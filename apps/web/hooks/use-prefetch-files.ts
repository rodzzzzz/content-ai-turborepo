'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getInitialFiles } from '@/actions/file';
import { Prisma } from '@prisma/client';
interface File {
    id: string;
    name: string;
    url: string;
    fileSize: number;
    fileType: string;
}

/**
 * Hook to prefetch files directly from the database without pagination.
 * Specifically designed for mapping URLs to file IDs when we have initial
 * media URLs but no cached file data.
 */
export function usePrefetchFiles(
    shouldFetch: boolean = false,
    filter: Prisma.FileWhereInput,
) {
    const queryClient = useQueryClient();
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [isFetched, setIsFetched] = useState(false);

    useEffect(() => {
        async function fetchAllFiles() {
            if (!shouldFetch) return;

            try {
                setIsLoading(true);
                setIsError(false);

                // Fetch all files directly from the API
                const response = await getInitialFiles(filter);

                if (response.error) {
                    console.error('Error fetching files:', response.error);
                    throw new Error(response.error);
                }

                setFiles(response.files || []);

                // Also add the files to the query cache for later use
                if (response.files && response.files.length > 0) {
                    // Simulate the structure expected by the query cache
                    queryClient.setQueryData(
                        ['files', { getAllForPrefetch: true }],
                        {
                            pages: [{ files: response.files }],
                            pageParams: [null],
                        },
                    );
                }

                setIsFetched(true);
            } catch (error) {
                console.error('Error prefetching all files:', error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAllFiles();
    }, [shouldFetch, queryClient]);

    return { files, isLoading, isError, isFetched };
}
