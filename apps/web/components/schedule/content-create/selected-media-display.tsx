'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, X, GripVerticalIcon } from 'lucide-react';
import Image from 'next/image';
import { formatBytes } from '@/lib/utils';
import { useGetMediaItem, MediaItem } from '@/components/media/media-selector';
import { useEffect, useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

interface SelectedMediaDisplayProps {
    selectedMedia: string[];
    selectedMediaObjects: { id: string; url: string }[];
    isPrefetchDone: boolean;
    onRemoveMedia: (mediaUrl: string) => void;
    onReorderMedia?: (newOrder: string[]) => void;
}

interface SortableMediaItemProps {
    mediaUrl: string;
    media: MediaItem;
    onRemove: (mediaUrl: string) => void;
}

function SortableMediaItem({
    mediaUrl,
    media,
    onRemove,
}: SortableMediaItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: mediaUrl });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 9999 : 'auto',
        position: isDragging ? 'relative' : 'static',
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`relative overflow-hidden bg-muted ${isDragging ? 'z-[9999]' : ''}`}
        >
            <CardContent className="p-0">
                <div className="relative aspect-square">
                    <Image
                        src={media.url || '/placeholder.svg'}
                        alt={media.name}
                        width={350}
                        height={350}
                        quality={90}
                        className="h-full w-full object-cover"
                    />
                    {media.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-8 w-8 text-white"
                            >
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        </div>
                    )}
                    <div className="absolute left-0 top-0 h-1/2 w-full bg-gradient-to-b from-black/50 to-transparent" />
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-2 h-fit w-fit cursor-grab rounded-lg p-1 active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVerticalIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-fit w-fit rounded-full p-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(mediaUrl);
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="p-2">
                    <p className="truncate text-sm font-medium">{media.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatBytes(media.fileSize)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

export function SelectedMediaDisplay({
    selectedMedia,
    selectedMediaObjects,
    isPrefetchDone,
    onRemoveMedia,
    onReorderMedia,
}: SelectedMediaDisplayProps) {
    const getMediaItem = useGetMediaItem();
    const [mediaCache, setMediaCache] = useState<Record<string, MediaItem>>({});
    const [loadingMedia, setLoadingMedia] = useState<Set<string>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Load media items that are not in cache
    useEffect(() => {
        const loadMissingMedia = async () => {
            const missingMedia = selectedMediaObjects.filter(
                (obj) => !mediaCache[obj.id] && !loadingMedia.has(obj.id),
            );

            if (missingMedia.length === 0) return;

            for (const mediaObj of missingMedia) {
                setLoadingMedia((prev) => new Set(prev).add(mediaObj.id));

                try {
                    const media = await getMediaItem(mediaObj.id);
                    if (media) {
                        setMediaCache((prev) => ({
                            ...prev,
                            [mediaObj.id]: media,
                        }));
                    }
                } catch (error) {
                    console.error(
                        `Failed to load media ${mediaObj.id}:`,
                        error,
                    );
                } finally {
                    setLoadingMedia((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(mediaObj.id);
                        return newSet;
                    });
                }
            }
        };

        loadMissingMedia();
    }, [selectedMediaObjects, mediaCache, loadingMedia, getMediaItem]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = selectedMedia.indexOf(active.id as string);
            const newIndex = selectedMedia.indexOf(over?.id as string);

            const newOrder = arrayMove(selectedMedia, oldIndex, newIndex);
            onReorderMedia?.(newOrder);
        }
    };

    return (
        <ScrollArea className="h-full" type="auto" isFullHeight>
            <div className="absolute inset-0 h-full">
                {!isPrefetchDone && selectedMediaObjects.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToParentElement]}
                    >
                        <SortableContext
                            items={selectedMedia}
                            strategy={rectSortingStrategy}
                        >
                            <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {selectedMedia.map((mediaUrl) => {
                                    const mediaObject =
                                        selectedMediaObjects.find(
                                            (m) => m.url === mediaUrl,
                                        );

                                    if (!mediaObject) return null;

                                    const media = mediaCache[mediaObject.id];
                                    const isLoading = loadingMedia.has(
                                        mediaObject.id,
                                    );

                                    // Show loading state
                                    if (isLoading || !media) {
                                        return (
                                            <Card
                                                key={mediaUrl}
                                                className="relative overflow-hidden bg-muted"
                                            >
                                                <CardContent className="p-0">
                                                    <div className="relative aspect-square">
                                                        <div className="flex h-full items-center justify-center">
                                                            <Loader2 className="h-8 w-8 animate-spin" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    }

                                    return (
                                        <SortableMediaItem
                                            key={mediaUrl}
                                            mediaUrl={mediaUrl}
                                            media={media}
                                            onRemove={onRemoveMedia}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </ScrollArea>
    );
}
