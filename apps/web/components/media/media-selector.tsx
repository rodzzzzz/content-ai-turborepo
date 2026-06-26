'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    SearchIcon,
    FileIcon,
    ImageIcon,
    MusicIcon,
    VideoIcon,
    FileTextIcon,
    FolderIcon,
    Loader2Icon,
    ArrowLeft,
    Check,
    ChevronRight,
} from 'lucide-react';
import { cn, formatBytes, getDiscreteFileType } from '@/lib/utils';
import { useFiles } from '@/contexts/file-context';
import FileUploadDialog from './file-upload-dialog';
import Image from 'next/image';
import { useInfiniteFiles } from '@/hooks/use-infinite-files';
import { useQueryClient } from '@tanstack/react-query';
import { FolderSkeleton } from './skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '../ui/badge';
import { toast } from '@/hooks/use-toast';
import { getFileById } from '@/actions/file';
import { isEmpty } from 'lodash';

// Add a type for media items that will be used across components
export interface MediaItem {
    id: string;
    name: string;
    url: string;
    fileSize: number;
    fileType: string;
    type?: string; // For compatibility with the old mock data
}

// Export a function to get media item by ID from queryClient cache or database
export function useGetMediaItem() {
    const queryClient = useQueryClient();

    const getMedia = async (mediaId: string): Promise<MediaItem | null> => {
        // Try to find the file in the query cache across all pages
        const queryCache = queryClient.getQueryCache();

        // Fix the query filter to use the proper format
        const queries = queryCache.findAll({
            queryKey: ['files'],
        });

        for (const query of queries) {
            const data = query.state.data as {
                pages: { files: MediaItem[] }[];
            };
            if (!data?.pages) continue;

            for (const page of data.pages) {
                if (!page?.files) continue;

                const file = page.files.find(
                    (f: MediaItem) => f.id === mediaId,
                );
                if (file) {
                    // Convert to MediaItem format
                    return {
                        id: file.id,
                        name: file.name,
                        url: file.url,
                        fileSize: file.fileSize,
                        fileType: file.fileType,
                        type: getDiscreteFileType(file.fileType), // Add type field for compatibility
                    };
                }
            }
        }

        // If not found in cache, fetch from database
        try {
            const result = await getFileById(mediaId);

            if (result.error || !result.file) {
                console.warn(`Failed to fetch file ${mediaId}:`, result.error);
                return null;
            }

            // Convert to MediaItem format
            return {
                id: result.file.id,
                name: result.file.name,
                url: result.file.url,
                fileSize: result.file.fileSize,
                fileType: result.file.fileType,
                type: getDiscreteFileType(result.file.fileType),
            };
        } catch (error) {
            console.error(`Error fetching file ${mediaId}:`, error);
            return null;
        }
    };

    // Return both the function and the queryClient for use elsewhere
    return Object.assign(getMedia, { queryClient });
}

interface MediaSelectorProps {
    onSelectMedia: (media: { id: string; url: string }[]) => void;
    maxItems: number;
    initialSelectedMedia: { id: string; url: string }[];
    onDone: () => void;
}

export function MediaSelector({
    onSelectMedia,
    maxItems,
    initialSelectedMedia,
    onDone,
}: MediaSelectorProps) {
    // Start with initialSelectedIds
    const [selectedItems, setSelectedItems] = useState<
        { id: string; url: string }[]
    >(initialSelectedMedia || []);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const queryClient = useQueryClient();

    // Track client-side mounting to prevent hydration issues
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Use our custom hook for infinite scrolling
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        status,
    } = useInfiniteFiles({
        folderId: currentFolder,
        search: searchQuery.length > 0 ? searchQuery : undefined,
    });

    const { folders, isLoadingFolders } = useFiles();

    // Flatten the pages of files into a single array
    const files = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap((page) => page.files || []);
    }, [data]);

    // Create an Intersection Observer to detect when the user scrolls to the bottom
    const observerTarget = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (
                entry?.isIntersecting &&
                hasNextPage &&
                !isFetchingNextPage &&
                status === 'success'
            ) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage, status],
    );

    useEffect(() => {
        // Only set up observer on client side after mounting
        if (!isMounted) return;

        const element = observerTarget.current;
        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: '200px', // Load earlier before user reaches bottom
            threshold: 0.1, // Trigger when element is 10% visible
        });

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [handleObserver, isMounted]);

    useEffect(() => {
        // Debounce the search invalidation to prevent too many API calls
        const debounceTimeout = setTimeout(() => {
            queryClient.invalidateQueries({
                queryKey: [
                    'files',
                    { folderId: currentFolder, search: searchQuery },
                ],
            });
        }, 300); // 300ms debounce

        return () => clearTimeout(debounceTimeout);
    }, [currentFolder, searchQuery, queryClient]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    // Set selected items when initialSelectedIds changes, but only once on initial mount
    // to prevent infinite loops
    useEffect(() => {
        if (isMounted) {
            // Only update if the arrays are different to prevent unnecessary renders
            if (
                JSON.stringify(selectedItems) !==
                JSON.stringify(initialSelectedMedia)
            ) {
                setSelectedItems(initialSelectedMedia || []);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSelectedMedia, isMounted]);

    // Toggle selection with maximum item limit
    const toggleSelection = (media: { id: string; url: string }) => {
        setSelectedItems((prev) => {
            if (prev.some((item) => item.id === media.id)) {
                return prev.filter((item) => item.id !== media.id);
            }

            // Check if adding would exceed max items
            if (prev.length >= maxItems) {
                toast({
                    title: 'Selection limit reached',
                    description: `You can only select up to ${maxItems} items`,
                    variant: 'destructive',
                });
                return prev;
            }

            return [...prev, media];
        });
    };

    const getCurrentFolderName = () => {
        if (!currentFolder) return null;
        const folder = folders.find((f) => f.id === currentFolder);
        return folder ? folder.name : null;
    };

    const getFileIcon = (fileType?: string) => {
        switch (fileType) {
            case 'image':
                return ImageIcon;
            case 'video':
                return VideoIcon;
            case 'audio':
                return MusicIcon;
            case 'document':
                return FileTextIcon;
            default:
                return FileIcon;
        }
    };

    // Function to finalize selection and call onSelectMedia
    const handleDone = () => {
        onSelectMedia(selectedItems);
        onDone();
    };

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <Badge variant="secondary" className="hidden md:block">
                        {selectedItems.length} of {maxItems} items selected
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onDone}>
                        Cancel
                    </Button>
                    <Button onClick={handleDone}>
                        Select {selectedItems.length}{' '}
                        {selectedItems.length === 1 ? 'item' : 'items'}
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-full" type="auto" isFullHeight>
                <div className="absolute inset-0 flex h-full flex-col gap-8 pt-4">
                    {/* Back button when in a folder */}
                    {currentFolder && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Button
                                variant="link"
                                className="gap-1 p-0 text-sm"
                                onClick={() => setCurrentFolder(null)}
                            >
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Go back
                            </Button>

                            <ChevronRight className="h-4 w-4" />

                            <div className="flex items-center gap-1">
                                <FolderIcon className="h-4 w-4" />
                                <h2 className="font-medium">
                                    {getCurrentFolderName()}
                                </h2>
                            </div>
                        </div>
                    )}

                    {/* Folders section - only show when at root */}
                    {!currentFolder ||
                        (!isEmpty(folders) && (
                            <div>
                                <h2 className="mb-3 text-lg font-semibold">
                                    Folders
                                </h2>
                                {/* Folder grid - simplified from media-storage.tsx */}
                                {isLoadingFolders ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                        {Array.from({ length: 4 }).map(
                                            (_, index) => (
                                                <FolderSkeleton key={index} />
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                        {folders.map((folder) => (
                                            <div
                                                key={folder.id}
                                                className="relative cursor-pointer rounded-lg border p-4 hover:bg-muted"
                                                onClick={() =>
                                                    setCurrentFolder(folder.id)
                                                }
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FolderIcon className="h-6 w-6 stroke-muted-foreground stroke-1" />
                                                    <div className="w-full min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">
                                                            {folder.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {
                                                                folder._count
                                                                    .files
                                                            }{' '}
                                                            files
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                    {/* Files grid with selection capability */}
                    <div>
                        <div className="sticky top-0 z-10 flex -translate-y-[2px] flex-wrap items-center justify-between gap-2 bg-background pb-3 pt-[2px]">
                            <h2 className="text-lg font-semibold">Files</h2>
                            <div className="flex items-center gap-2">
                                <div className="relative w-full max-w-[360px]">
                                    <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            handleSearch(e.target.value)
                                        }
                                        className="pl-8"
                                    />
                                </div>

                                <FileUploadDialog />
                            </div>
                        </div>

                        {files.length === 0 && (
                            <div className="mt-12 flex h-full flex-col items-center justify-center text-center">
                                {isLoading ? (
                                    <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                    <>
                                        <FileIcon className="mb-4 h-8 w-8 text-muted-foreground" />
                                        <h3 className="text-xl font-medium">
                                            No files found
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Upload files or browse other folders
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Files grid */}
                        {files.length > 0 && (
                            <div className="grid h-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {files.map((file) => {
                                    const isSelected = selectedItems.some(
                                        (m) => m.id === file.id,
                                    );
                                    const fileType = getDiscreteFileType(
                                        file.fileType,
                                    );
                                    const FileIconComponent =
                                        getFileIcon(fileType);

                                    return (
                                        <div
                                            key={file.id}
                                            className={cn(
                                                'relative cursor-pointer overflow-hidden rounded-lg border hover:border-primary',
                                                isSelected &&
                                                    'ring-2 ring-primary ring-offset-2',
                                            )}
                                            onClick={() =>
                                                toggleSelection(file)
                                            }
                                        >
                                            {/* File preview */}
                                            <div className="relative aspect-square bg-muted">
                                                {fileType === 'image' ? (
                                                    <Image
                                                        src={
                                                            file.url ||
                                                            '/placeholder.svg'
                                                        }
                                                        alt={file.name}
                                                        width={350}
                                                        height={350}
                                                        quality={90}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center">
                                                        <FileIconComponent className="h-12 w-12 text-muted-foreground" />
                                                    </div>
                                                )}

                                                {/* Selection indicator */}
                                                {isSelected && (
                                                    <div className="absolute right-2 top-2 rounded-full border border-background bg-primary p-1 text-primary-foreground">
                                                        <Check className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* File info */}
                                            <div className="p-2">
                                                <p className="truncate text-sm font-medium">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatBytes(file.fileSize)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Loading indicator and observer for infinite scrolling */}
                        {(isFetchingNextPage || hasNextPage) && (
                            <div
                                className="my-4 flex justify-center py-4"
                                ref={observerTarget}
                            >
                                {isFetchingNextPage && (
                                    <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
