'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    SearchIcon,
    FolderPlusIcon,
    TrashIcon,
    FileIcon,
    ImageIcon,
    MusicIcon,
    VideoIcon,
    FileTextIcon,
    FolderIcon,
    MoreVerticalIcon,
    LayoutGridIcon,
    ListIcon,
    Loader2Icon,
    FolderInput,
    ArrowLeft,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatBytes, getDiscreteFileType } from '@/lib/utils';
import { FolderDeleteDialog } from './folder-delete-dialog';
import { useFiles } from '@/contexts/file-context';
import { FolderUpdateDialog } from './folder-update-dialog';
import { FolderCreateDialog } from './folder-create-dialog';
import FileUploadDialog from './file-upload-dialog';
import { FileDeleteDialog } from './file-delete-dialog';
import Image from 'next/image';
import { FileRenameDialog } from './file-rename-dialog';
import { FileMoveDialog } from './file-move-dialog';
import { useInfiniteFiles } from '@/hooks/use-infinite-files';
import { useQueryClient } from '@tanstack/react-query';
import { FolderSkeleton } from './skeleton';

export default function MediaPage() {
    const {
        folders,
        isLoadingFolders,
        openDialog,
        setOpenDialog,
        setDialogFolderData,
        setDialogFileData,
    } = useFiles();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [hasSelected, setHasSelected] = useState(selectedItems.length > 0);
    const [isGridView, setIsGridView] = useState(true);
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);

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

    // Optimize query invalidation - use specific query key
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

    useEffect(() => {
        setHasSelected(selectedItems.length > 0);
    }, [selectedItems]);

    useEffect(() => {
        setSelectedItems([]);
    }, [currentFolder]);

    useEffect(() => {
        const url = new URL(window.location.href);

        if (currentFolder) {
            url.searchParams.set('folder', currentFolder);
        } else {
            url.searchParams.delete('folder');
        }

        window.history.replaceState({}, '', url);
    }, [currentFolder]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            // Handle file upload here
            console.log('Files to upload:', files);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedItems((prev) => {
            if (prev.includes(id)) {
                return prev.filter((itemId) => itemId !== id);
            }
            return [...prev, id];
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

    const getSelectedItemsFileData = () => {
        return selectedItems.map((id) => {
            const file = files.find((file) => file.id === id);
            if (!file) {
                throw new Error(`File with id ${id} not found`);
            }
            return {
                id,
                key: file.key,
                name: file.name,
                fileSize: file.fileSize,
                fileType: file.fileType,
            };
        });
    };

    return (
        <div className="flex h-full flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="link"
                        className={cn(
                            'p-0 text-muted-foreground',
                            !currentFolder && 'hidden',
                        )}
                        onClick={() => setCurrentFolder(null)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </div>
                <div className="flex justify-end gap-2">
                    {!currentFolder && (
                        <Button
                            variant="outline"
                            onClick={() => setOpenDialog('FOLDER_CREATE')}
                        >
                            <FolderPlusIcon className="h-4 w-4" />
                            <span className="hidden md:block">New Folder</span>
                        </Button>
                    )}
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            multiple
                            onChange={handleFileUpload}
                        />
                        <FileUploadDialog />
                    </div>
                </div>
            </div>

            {currentFolder && (
                <div className="flex items-center gap-2">
                    <FolderIcon className="h-8 w-8 stroke-1" />
                    <h1 className="text-2xl font-semibold">
                        {getCurrentFolderName()}
                    </h1>
                </div>
            )}

            {!currentFolder && (
                <div>
                    {folders.length > 0 && (
                        <h2 className="mb-3 text-lg font-semibold">Folders</h2>
                    )}
                    {isLoadingFolders ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <FolderSkeleton key={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {folders.map((item) => (
                                <div
                                    key={item.id}
                                    className="relative cursor-pointer rounded-lg border p-4"
                                    onClick={() => setCurrentFolder(item.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center">
                                            <FolderIcon className="h-6 w-6 stroke-muted-foreground stroke-1" />
                                        </div>
                                        <div className="w-full min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item._count.files} files
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <MoreVerticalIcon className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDialogFolderData({
                                                            folderId: item.id,
                                                            folderName:
                                                                item.name,
                                                        });
                                                        setOpenDialog(
                                                            'FOLDER_UPDATE',
                                                        );
                                                    }}
                                                >
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDialogFolderData({
                                                            folderId: item.id,
                                                        });
                                                        setOpenDialog(
                                                            'FOLDER_DELETE',
                                                        );
                                                    }}
                                                >
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex h-full flex-col gap-3">
                <h2 className="text-lg font-semibold">Files</h2>
                <div className="flex w-full flex-col gap-2 md:flex-row">
                    <div className="flex w-full gap-2">
                        <div className="relative w-full md:max-w-md">
                            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsGridView(!isGridView)}
                            className="flex-none"
                        >
                            {isGridView ? (
                                <ListIcon className="h-4 w-4" />
                            ) : (
                                <LayoutGridIcon className="h-4 w-4" />
                            )}
                        </Button>

                        {hasSelected && (
                            <Button
                                variant="outline"
                                onClick={() => setSelectedItems([])}
                            >
                                Deselect {selectedItems.length} items
                            </Button>
                        )}
                    </div>
                    {hasSelected && (
                        <div className="flex gap-2 md:ml-auto">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setOpenDialog('FILE_MOVE');
                                    setDialogFileData({
                                        files: getSelectedItemsFileData(),
                                        movableToHome: selectedItems.some(
                                            (id) =>
                                                files.find(
                                                    (file) => file.id === id,
                                                )?.folderId !== null,
                                        ),
                                    });
                                }}
                            >
                                <FolderInput className="h-4 w-4" />
                                Move to folder
                            </Button>

                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setOpenDialog('FILE_DELETE');
                                    setDialogFileData({
                                        files: getSelectedItemsFileData(),
                                    });
                                }}
                            >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>

                {files.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        {isLoading ? (
                            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <FileIcon className="mb-4 h-8 w-8 text-muted-foreground" />
                                <h3 className="text-xl font-medium">
                                    No files found
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Upload files or create a folder to get
                                    started
                                </p>
                            </>
                        )}
                    </div>
                )}

                {files.length > 0 && (
                    <div
                        className={cn(
                            'grid w-full',
                            isGridView
                                ? 'grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5'
                                : 'grid-cols-1',
                        )}
                    >
                        {files.map((item) => {
                            const isSelected = selectedItems.includes(item.id);
                            const fileType = getDiscreteFileType(item.fileType);
                            const FileIconComponent = getFileIcon(fileType);

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'group relative flex cursor-pointer flex-col rounded-lg border p-2 hover:border-primary',
                                        isSelected && 'border-primary',
                                        isSelected &&
                                            !isGridView &&
                                            'border-border bg-muted',
                                        !isGridView &&
                                            'flex-row items-center rounded-none border-x-0 border-t-0 py-4 hover:border-border hover:bg-muted',
                                    )}
                                    onClick={() => {
                                        if (hasSelected) {
                                            toggleSelection(item.id);
                                        }
                                    }}
                                >
                                    <div
                                        className={cn(
                                            'flex w-full items-center gap-2',
                                            isGridView && 'flex-col gap-0',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                isGridView
                                                    ? 'flex h-52 w-full items-center justify-center rounded-t-md bg-muted'
                                                    : 'flex items-center justify-center',
                                            )}
                                        >
                                            {fileType === 'image' &&
                                            isGridView ? (
                                                <div className="relative h-full w-full">
                                                    <div
                                                        className={cn(
                                                            'absolute inset-0 z-10 bg-gradient-to-b from-white/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100',
                                                            isSelected &&
                                                                'opacity-100',
                                                        )}
                                                    ></div>
                                                    <Image
                                                        src={
                                                            item.url ||
                                                            '/placeholder.svg'
                                                        }
                                                        alt={`Preview ${item.name}`}
                                                        className="h-full w-full rounded-t-md object-cover"
                                                        width={350}
                                                        height={350}
                                                        quality={90}
                                                    />
                                                </div>
                                            ) : (
                                                <FileIconComponent
                                                    className={cn(
                                                        'h-6 w-6 stroke-muted-foreground stroke-1',
                                                        !isGridView &&
                                                            'group-hover:opacity-0',
                                                        !isGridView &&
                                                            isSelected &&
                                                            'opacity-0',
                                                    )}
                                                />
                                            )}
                                            <div
                                                className={cn(
                                                    'absolute z-50 opacity-0 group-hover:opacity-100',
                                                    isGridView &&
                                                        'right-2 top-2 opacity-100 lg:opacity-0',
                                                    isSelected &&
                                                        'opacity-100 lg:opacity-100',
                                                )}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    className={cn(
                                                        isGridView &&
                                                            'h-5 w-5 border-2 shadow-[0_0_0_2px_white] focus-within:shadow-[0_0_0_2px_white]',
                                                    )}
                                                    onCheckedChange={() => {
                                                        toggleSelection(
                                                            item.id,
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                'flex w-full',
                                                isGridView
                                                    ? 'py-2'
                                                    : 'items-center',
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'min-w-0',
                                                    isGridView
                                                        ? 'w-full'
                                                        : 'flex-1',
                                                )}
                                            >
                                                <p className="truncate text-sm font-medium">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatBytes(item.fileSize)}
                                                </p>
                                            </div>
                                            {!hasSelected && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="ml-auto h-8 w-8 p-0"
                                                        >
                                                            <MoreVerticalIcon className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                toggleSelection(
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            Select
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setDialogFileData(
                                                                    {
                                                                        files: [
                                                                            {
                                                                                id: item.id,
                                                                                key: item.key,
                                                                                name: item.name,
                                                                                fileSize:
                                                                                    item.fileSize,
                                                                                fileType:
                                                                                    item.fileType,
                                                                            },
                                                                        ],
                                                                        fileName:
                                                                            item.name,
                                                                    },
                                                                );
                                                                setOpenDialog(
                                                                    'FILE_RENAME',
                                                                );
                                                            }}
                                                        >
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setDialogFileData(
                                                                    {
                                                                        files: [
                                                                            {
                                                                                id: item.id,
                                                                                key: item.key,
                                                                                name: item.name,
                                                                                fileSize:
                                                                                    item.fileSize,
                                                                                fileType:
                                                                                    item.fileType,
                                                                            },
                                                                        ],
                                                                        movableToHome:
                                                                            item.folderId !==
                                                                            null,
                                                                    },
                                                                );
                                                                setOpenDialog(
                                                                    'FILE_MOVE',
                                                                );
                                                            }}
                                                        >
                                                            Move
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setOpenDialog(
                                                                    'FILE_DELETE',
                                                                );
                                                                setDialogFileData(
                                                                    {
                                                                        files: [
                                                                            {
                                                                                id: item.id,
                                                                                key: item.key,
                                                                                name: item.name,
                                                                                fileSize:
                                                                                    item.fileSize,
                                                                                fileType:
                                                                                    item.fileType,
                                                                            },
                                                                        ],
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
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

            <FolderCreateDialog
                open={openDialog === 'FOLDER_CREATE'}
                onOpenChange={(open) =>
                    setOpenDialog(open ? 'FOLDER_CREATE' : null)
                }
            />

            <FolderUpdateDialog
                open={openDialog === 'FOLDER_UPDATE'}
                onOpenChange={(open) =>
                    setOpenDialog(open ? 'FOLDER_UPDATE' : null)
                }
            />

            <FolderDeleteDialog
                open={openDialog === 'FOLDER_DELETE'}
                onOpenChange={(open) =>
                    setOpenDialog(open ? 'FOLDER_DELETE' : null)
                }
            />

            <FileRenameDialog
                open={openDialog === 'FILE_RENAME'}
                onOpenChange={(open) =>
                    setOpenDialog(open ? 'FILE_RENAME' : null)
                }
            />

            <FileMoveDialog
                open={openDialog === 'FILE_MOVE'}
                onOpenChange={(open) =>
                    setOpenDialog(open ? 'FILE_MOVE' : null)
                }
                setSelectedItems={setSelectedItems}
            />

            <FileDeleteDialog
                open={openDialog === 'FILE_DELETE'}
                onOpenChange={(open) =>
                    setOpenDialog(open ? 'FILE_DELETE' : null)
                }
                setSelectedItems={setSelectedItems}
            />
        </div>
    );
}
