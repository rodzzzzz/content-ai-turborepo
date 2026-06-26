'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ContentFormValues } from './content-creator';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    ArrowRight,
    ImageIcon,
    AlertCircle,
    SparklesIcon,
    PlusCircleIcon,
} from 'lucide-react';
import { MediaSelector, MediaItem } from '@/components/media/media-selector';
import { useQueryClient } from '@tanstack/react-query';
import { usePrefetchFiles } from '@/hooks/use-prefetch-files';
import { GenerateImage } from '@/components/generate-image/generate-image';
import { SelectedMediaDisplay } from './selected-media-display';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface MediaTabProps {
    platformSettings: {
        name: string;
        contentMaxLength: number;
        mediaMaxCount: number;
    };
    onNext: () => void;
    onBack: () => void;
    mediaSuggestion?: string;
    imagePrompt?: string;
}

export function MediaTab({
    platformSettings,
    onNext,
    onBack,
    mediaSuggestion,
    imagePrompt,
}: MediaTabProps) {
    const {
        watch,
        setValue,
        formState: { errors },
    } = useFormContext<ContentFormValues>();
    const selectedMedia = watch('mediaUrl');
    const socialPost = watch('content');
    const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
    const [generateImageDialogOpen, setGenerateImageDialogOpen] =
        useState(false);
    const [selectedMediaObjects, setSelectedMediaObjects] = useState<
        { id: string; url: string }[]
    >([]);
    const hasPrefetchedRef = useRef(false);

    const queryClient = useQueryClient();

    // Use our new prefetch hook to load all files when we have initial selectedMedia
    // Only prefetch when we have URLs but no mapped objects, and we haven't already prefetched
    const shouldPrefetch =
        selectedMedia?.length > 0 &&
        selectedMediaObjects.length === 0 &&
        !hasPrefetchedRef.current;

    const { files: allFiles, isFetched: isPrefetchDone } = usePrefetchFiles(
        shouldPrefetch,
        {
            url: {
                in: selectedMedia,
            },
        },
    );

    // Mark as prefetched when the fetch is done
    useEffect(() => {
        if (isPrefetchDone) {
            hasPrefetchedRef.current = true;
        }
    }, [isPrefetchDone]);

    const handleMediaSelect = (media: { id: string; url: string }[]) => {
        setSelectedMediaObjects(media);
        setValue(
            'mediaUrl',
            media.map((m) => m.url),
        );
    };

    const removeMedia = (mediaUrl: string) => {
        // Remove URL from form values
        setValue(
            'mediaUrl',
            selectedMedia.filter((url) => url !== mediaUrl),
        );

        // Find and remove corresponding ID
        const idToRemove = selectedMediaObjects.find(
            (m) => m.url === mediaUrl,
        )?.id;

        if (idToRemove) {
            setSelectedMediaObjects(
                selectedMediaObjects.filter((m) => m.id !== idToRemove),
            );
        }
    };

    const reorderMedia = (newOrder: string[]) => {
        // Update form values with new order
        setValue('mediaUrl', newOrder);

        // Reorder selectedMediaObjects to match the new order
        const reorderedObjects = newOrder
            .map((url) => selectedMediaObjects.find((obj) => obj.url === url))
            .filter(Boolean) as { id: string; url: string }[];

        setSelectedMediaObjects(reorderedObjects);
    };

    // Helper function to find files that match the URLs
    const findFilesByUrls = (urls: string[]) => {
        if (!urls || urls.length === 0) return [];

        // First check our prefetched files
        if (allFiles && allFiles.length > 0) {
            return urls
                .map((url) => {
                    const file = allFiles.find((f) => f.url === url);
                    return { id: file?.id, url: file?.url };
                })
                .filter(Boolean) as { id: string; url: string }[];
        }

        // Fallback to checking the query cache
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.findAll({
            queryKey: ['files'],
        });

        const cachedFiles: MediaItem[] = [];

        // Extract files from query cache
        for (const query of queries) {
            const data = query.state.data as {
                pages: { files: MediaItem[] }[];
            };
            if (!data?.pages) continue;

            for (const page of data.pages) {
                if (!page?.files) continue;

                for (const file of page.files) {
                    if (!file) continue;

                    cachedFiles.push({
                        id: file.id,
                        name: file.name,
                        url: file.url,
                        fileSize: file.fileSize,
                        fileType: file.fileType,
                        type: file.fileType?.includes('image')
                            ? 'image'
                            : file.fileType?.includes('video')
                              ? 'video'
                              : 'file',
                    });
                }
            }
        }

        // Map URLs to file IDs
        return urls
            .map((url) => {
                const file = cachedFiles.find((f) => f.url === url);
                return { id: file?.id, url: file?.url };
            })
            .filter(Boolean) as { id: string; url: string }[];
    };

    // Initialize selectedMediaIds based on URLs in form
    useEffect(() => {
        // Only attempt to map URLs to IDs if:
        // 1. We have URLs to map
        // 2. We haven't already mapped IDs
        // 3. The prefetch has completed
        if (
            selectedMedia &&
            selectedMedia.length > 0 &&
            selectedMediaObjects.length === 0 &&
            isPrefetchDone
        ) {
            const mediaObjects = findFilesByUrls(selectedMedia);
            if (mediaObjects.length > 0) {
                setSelectedMediaObjects(mediaObjects);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMedia, selectedMediaObjects.length, isPrefetchDone, allFiles]);

    const isMediaRequired = platformSettings.name === 'Instagram';
    const hasRequiredMedia = !isMediaRequired || selectedMedia.length > 0;

    return (
        <div className="flex h-full flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold">Select Media</h2>
                <p className="mt-1 text-muted-foreground">
                    Choose media for your {platformSettings.name} post
                </p>
            </div>

            <div className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium">Selected Media</h3>
                        <p className="text-sm text-muted-foreground">
                            {`${selectedMedia.length} of ${platformSettings.mediaMaxCount} items selected`}
                        </p>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={
                                    !(
                                        (shouldPrefetch && isPrefetchDone) ||
                                        !shouldPrefetch
                                    )
                                }
                            >
                                <PlusCircleIcon className="h-4 w-4" />
                                Add Media
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="p-2">
                            <Dialog
                                open={generateImageDialogOpen}
                                onOpenChange={setGenerateImageDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start px-2"
                                    >
                                        <SparklesIcon className="h-4 w-4 stroke-yellow-500" />
                                        Generate Using AI
                                    </Button>
                                </DialogTrigger>
                                <DialogTitle className="sr-only">
                                    Generate Images Using AI
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Generate images using AI
                                </DialogDescription>
                                <DialogContent
                                    className="h-full max-w-7xl p-4 sm:rounded-none md:p-6 lg:max-h-[90vh] lg:rounded-lg [&>button]:hidden"
                                    showOverlay={false}
                                    onInteractOutside={(e) => {
                                        e.preventDefault();
                                    }}
                                    onEscapeKeyDown={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <div className="min-h-0">
                                        <GenerateImage
                                            onSelectMedia={handleMediaSelect}
                                            maxItems={
                                                platformSettings.mediaMaxCount
                                            }
                                            initialSelectedMedia={
                                                selectedMediaObjects
                                            }
                                            onDone={() =>
                                                setGenerateImageDialogOpen(
                                                    false,
                                                )
                                            }
                                            mediaSuggestion={mediaSuggestion}
                                            imagePrompt={imagePrompt}
                                            socialPost={socialPost}
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog
                                open={mediaDialogOpen}
                                onOpenChange={setMediaDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start px-2"
                                    >
                                        <ImageIcon className="h-4 w-4 stroke-blue-500" />
                                        Browse Library
                                    </Button>
                                </DialogTrigger>
                                <DialogTitle className="sr-only">
                                    Media Library
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Browse your media library
                                </DialogDescription>
                                <DialogContent
                                    className="h-full max-w-7xl sm:rounded-none lg:max-h-[90vh] lg:rounded-lg [&>button]:hidden"
                                    showOverlay={false}
                                    onInteractOutside={(e) => {
                                        e.preventDefault();
                                    }}
                                    onEscapeKeyDown={(e) => {
                                        e.preventDefault();
                                    }}
                                >
                                    <MediaSelector
                                        onSelectMedia={handleMediaSelect}
                                        maxItems={
                                            platformSettings.mediaMaxCount
                                        }
                                        initialSelectedMedia={
                                            selectedMediaObjects
                                        }
                                        onDone={() => setMediaDialogOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </PopoverContent>
                    </Popover>
                </div>

                {errors.mediaUrl && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {errors.mediaUrl.message}
                        </AlertDescription>
                    </Alert>
                )}

                {isMediaRequired && selectedMedia.length === 0 && (
                    <Alert className="bg-muted">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {platformSettings.name} requires at least one media
                            item
                        </AlertDescription>
                    </Alert>
                )}

                {selectedMedia.length > 0 ? (
                    <SelectedMediaDisplay
                        selectedMedia={selectedMedia}
                        selectedMediaObjects={selectedMediaObjects}
                        isPrefetchDone={isPrefetchDone}
                        onRemoveMedia={removeMedia}
                        onReorderMedia={reorderMedia}
                    />
                ) : (
                    <Card className="h-full border-dashed">
                        <CardContent className="flex h-full flex-col items-center justify-center p-6">
                            <ImageIcon className="mb-4 h-10 w-10 text-muted-foreground" />
                            <p className="text-center text-muted-foreground">
                                No media selected. Click &quot;Browse Media
                                Library&quot; to select media.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="mt-auto flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>
                <Button onClick={onNext} disabled={!hasRequiredMedia}>
                    Continue to Publish
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
