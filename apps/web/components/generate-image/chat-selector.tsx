'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MenuIcon, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImageChatStore } from '@/hooks/use-image-chat-store';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { ImageChat, ImageChatMessage } from '@prisma/client';
import { isEmpty } from 'lodash';
import { UIDataTypes, UIMessagePart, UITools } from 'ai';
import { useInView } from 'react-intersection-observer';
import { ChatItem } from './chat-item';

// Constants
const SCROLL_AREA_HEIGHT = 300;

interface ChatSelectorProps {
    selectedChatId?: string;
    setSelectedChatId: React.Dispatch<React.SetStateAction<string | undefined>>;
    className?: string;
    selectedMedia?: { id: string; url: string }[];
}

type ChatWithMessages = ImageChat & {
    messages: ImageChatMessage[];
};

// Helper function to check if a chat contains selected media
const hasSelectedMedia = (
    chat: ChatWithMessages,
    selectedMedia: { id: string; url: string }[],
): boolean => {
    if (isEmpty(selectedMedia) || isEmpty(chat.messages)) {
        return false;
    }

    const selectedMediaIds = new Set(selectedMedia.map((media) => media.id));

    return chat.messages.some((message) => {
        if (!isEmpty(message.parts)) {
            return (
                message.parts as UIMessagePart<UIDataTypes, UITools>[]
            ).some((part) => {
                if (part.type !== 'data-generate-image') {
                    return false;
                }

                const data = part.data as { images: { id: string }[] };

                return data.images.some((image) =>
                    selectedMediaIds.has(image.id),
                );
            });
        }
        return false;
    });
};

export function ChatSelector({
    selectedChatId,
    setSelectedChatId,
    className,
    selectedMedia = [],
}: ChatSelectorProps) {
    const {
        chats,
        isLoadingChats,
        createChat,
        isCreatingChat,
        deleteChat,
        isDeletingChat,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        prefetchChatsWithMedia,
    } = useImageChatStore();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const prefetchedMediaRef = useRef<Set<string>>(new Set());

    // Intersection observer for infinite scroll
    const { ref: loadMoreRef } = useInView({
        onChange: (inView) => {
            if (inView && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
    });

    // Prefetch chats containing selected media when selectedMedia changes
    useEffect(() => {
        if (selectedMedia.length > 0 && !isLoadingChats) {
            const mediaIds = selectedMedia.map((media) => media.id);

            // Check if we've already prefetched these media IDs
            const hasNewMedia = mediaIds.some(
                (id) => !prefetchedMediaRef.current.has(id),
            );

            if (hasNewMedia) {
                prefetchChatsWithMedia(mediaIds);
                // Update the ref to track prefetched media
                mediaIds.forEach((id) => prefetchedMediaRef.current.add(id));
            }
        }
    }, [selectedMedia, isLoadingChats, prefetchChatsWithMedia]);

    // Memoize sorted chats to avoid recalculation on every render
    const sortedChats = useMemo(() => {
        if (isLoadingChats) return [];

        // Filter out any undefined chats and sort: chats with selected media first, then by updatedAt
        return [...chats]
            .filter((chat): chat is ChatWithMessages => chat != null)
            .sort((a, b) => {
                const aHasSelectedMedia = hasSelectedMedia(a, selectedMedia);
                const bHasSelectedMedia = hasSelectedMedia(b, selectedMedia);

                // If one has selected media and the other doesn't, prioritize the one with selected media
                if (aHasSelectedMedia && !bHasSelectedMedia) return -1;
                if (!aHasSelectedMedia && bHasSelectedMedia) return 1;

                // If both have the same selected media status, sort by updatedAt (newest first)
                return (
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                );
            });
    }, [chats, selectedMedia, isLoadingChats]);

    // Memoize filtered chat groups
    const chatsWithSelectedMedia = useMemo(
        () =>
            sortedChats.filter((chat) => hasSelectedMedia(chat, selectedMedia)),
        [sortedChats, selectedMedia],
    );

    const chatsWithoutSelectedMedia = useMemo(
        () =>
            sortedChats.filter(
                (chat) => !hasSelectedMedia(chat, selectedMedia),
            ),
        [sortedChats, selectedMedia],
    );

    const handleChatSelect = useCallback(
        (chatId: string) => {
            setSelectedChatId?.(chatId);
            setIsPopoverOpen(false);
        },
        [setSelectedChatId],
    );

    const handleNewChat = useCallback(async () => {
        const result = await createChat('');

        if (result.id) {
            setSelectedChatId?.(result.id);
            setIsPopoverOpen(false);
        } else {
            toast({
                title: 'Something went wrong.',
                description: 'Chat was not created. Please try again.',
                variant: 'destructive',
            });
        }
    }, [createChat, setSelectedChatId]);

    const handleDeleteClick = useCallback(
        (e: React.MouseEvent, chat: { id: string; title: string }) => {
            e.preventDefault();
            e.stopPropagation();
            setChatToDelete(chat);
            setIsDeleteDialogOpen(true);
        },
        [],
    );

    const handleDeleteConfirm = useCallback(async () => {
        if (!chatToDelete) return;

        try {
            await deleteChat(chatToDelete.id);

            // If the deleted chat was selected, clear the selection
            if (selectedChatId === chatToDelete.id) {
                setSelectedChatId(undefined);
            }

            toast({
                description: 'Chat has been deleted.',
            });
        } catch (error) {
            console.error(error);

            toast({
                title: 'Something went wrong.',
                description: 'Chat was not deleted. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setChatToDelete(null);
        }
    }, [chatToDelete, deleteChat, selectedChatId, setSelectedChatId]);

    if (isLoadingChats) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                    Loading chats...
                </span>
            </div>
        );
    }

    return (
        <>
            <div className={cn('flex items-center gap-2', className)}>
                <Popover
                    open={isPopoverOpen}
                    onOpenChange={setIsPopoverOpen}
                    modal={true}
                >
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MenuIcon className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="start">
                        <div className="w-full p-1">
                            <div className="mb-2 py-1.5">
                                <Button
                                    onClick={handleNewChat}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    disabled={isCreatingChat}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    New Chat
                                </Button>
                            </div>

                            {sortedChats.length === 0 ? (
                                <div
                                    className={`flex h-[${SCROLL_AREA_HEIGHT}px] w-full items-center justify-center px-2 py-3 text-center text-sm text-muted-foreground`}
                                >
                                    No previous chats found
                                </div>
                            ) : (
                                <ScrollArea
                                    className={`h-[${SCROLL_AREA_HEIGHT}px] w-full`}
                                >
                                    {/* Selected Media Group */}
                                    {selectedMedia.length > 0 && (
                                        <>
                                            {chatsWithSelectedMedia.length >
                                            0 ? (
                                                chatsWithSelectedMedia.map(
                                                    (chat) => (
                                                        <ChatItem
                                                            key={chat.id}
                                                            chat={chat}
                                                            chatHasSelectedMedia={
                                                                true
                                                            }
                                                            handleDeleteClick={
                                                                handleDeleteClick
                                                            }
                                                            handleChatSelect={
                                                                handleChatSelect
                                                            }
                                                            isSelected={
                                                                selectedChatId ===
                                                                chat.id
                                                            }
                                                        />
                                                    ),
                                                )
                                            ) : (
                                                <div className="flex h-16 w-full items-center justify-center px-2 py-3 text-center text-sm text-muted-foreground">
                                                    No chats contain the
                                                    selected media
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 px-2 py-1.5">
                                                <Separator className="flex-1" />
                                                <h4 className="flex-shrink-0 text-xs font-medium text-muted-foreground">
                                                    All Chats
                                                </h4>
                                                <Separator className="flex-1" />
                                            </div>
                                        </>
                                    )}

                                    {/* All Chats Group */}
                                    {chatsWithoutSelectedMedia.map((chat) => (
                                        <ChatItem
                                            key={chat.id}
                                            chat={chat}
                                            chatHasSelectedMedia={false}
                                            handleDeleteClick={
                                                handleDeleteClick
                                            }
                                            handleChatSelect={handleChatSelect}
                                            isSelected={
                                                selectedChatId === chat.id
                                            }
                                        />
                                    ))}

                                    {/* Infinite scroll trigger */}
                                    <div
                                        ref={loadMoreRef}
                                        className="flex justify-center py-2"
                                    >
                                        {isFetchingNextPage && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        Are you sure you want to delete &quot;
                        {chatToDelete?.title}&quot;? This action cannot be
                        undone.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeletingChat}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeletingChat}
                        >
                            {isDeletingChat && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
