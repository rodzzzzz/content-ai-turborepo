import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    InfiniteData,
} from '@tanstack/react-query';
import {
    createChat,
    getInfiniteChats,
    getChatsContainingMedia,
    getChatById,
    deleteChat,
    updateChat,
} from '@/actions/image-chat';
import { useSearchParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';

export function useImageChatStore() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const chatId = searchParams.get('chatId');

    const {
        data: chatsData,
        isLoading: isLoadingChats,
        error: chatsError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchChats,
    } = useInfiniteQuery({
        queryKey: ['chats'],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            const result = await getInfiniteChats({
                limit: 12,
                cursor: pageParam,
            });
            if (result.error) throw new Error(result.error);
            return result;
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        retry: 1,
    });

    const {
        data: currentChatData,
        isLoading: isLoadingCurrentChat,
        error: currentChatError,
    } = useQuery({
        queryKey: ['chat', chatId],
        queryFn: async () => {
            if (!chatId) return null;
            const result = await getChatById(chatId);
            if (result.error) throw new Error(result.error);
            return result;
        },
        enabled: !!chatId,
        retry: 1,
    });

    const currentChat = currentChatData?.chat;

    const createChatMutation = useMutation({
        mutationFn: async (title: string) => {
            const result = await createChat(title);
            if (result.error || !result.chat)
                throw new Error(result.error || 'Failed to create chat');
            return result.chat;
        },
        onSuccess: (result) => {
            queryClient.setQueryData(
                ['chats'],
                (
                    oldData: InfiniteData<{
                        chats: (typeof result)[];
                        hasNextPage: boolean;
                        nextCursor: string | undefined;
                    }>,
                ) => {
                    if (!oldData?.pages) return oldData;
                    return {
                        ...oldData,
                        pages: [
                            {
                                chats: [result],
                                hasNextPage: true,
                                nextCursor: undefined,
                            },
                            ...oldData.pages,
                        ],
                    };
                },
            );
        },
    });

    const updateChatMutation = useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: { title: string };
        }) => {
            const result = await updateChat(id, data);
            if (result.error || !result.chat)
                throw new Error(result.error || 'Failed to update chat');
            return result.chat;
        },
        onSuccess: (result, { id }) => {
            queryClient.setQueryData(
                ['chats'],
                (
                    oldData: InfiniteData<{
                        chats: (typeof result)[];
                        hasNextPage: boolean;
                        nextCursor: string | undefined;
                    }>,
                ) => {
                    if (!oldData?.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) => ({
                            ...page,
                            chats: page.chats.map((chat) =>
                                chat.id === id ? result : chat,
                            ),
                        })),
                    };
                },
            );

            queryClient.invalidateQueries({ queryKey: ['chat', id] });
        },
    });

    const deleteChatMutation = useMutation({
        mutationFn: async (deleteChatId: string) => {
            const result = await deleteChat(deleteChatId);
            if (result.error) throw new Error(result.error);

            return deleteChatId;
        },
        onSuccess: (deleteChatId) => {
            queryClient.setQueryData(
                ['chats'],
                (
                    oldData: InfiniteData<{
                        chats: {
                            name: string | null;
                            id: string;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
                            organizationId: string;
                        }[];
                        hasNextPage: boolean;
                        nextCursor: string | undefined;
                    }>,
                ) => {
                    if (!oldData?.pages) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) => ({
                            ...page,
                            chats: page.chats.filter(
                                (chat) => chat.id !== deleteChatId,
                            ),
                        })),
                    };
                },
            );

            if (deleteChatId === chatId) {
                window.history.replaceState({}, '', pathname);
            }
        },
    });

    // Flatten pages data for backward compatibility with deduplication
    const chats = useMemo(() => {
        if (!chatsData?.pages) return [];

        const allChats = chatsData.pages.flatMap((page) => page.chats);
        const seen = new Set();
        return allChats.filter((chat) => {
            if (!chat?.id || seen.has(chat.id)) {
                return false;
            }
            seen.add(chat.id);
            return true;
        });
    }, [chatsData]);

    // Function to prefetch chats containing specific media
    const prefetchChatsWithMedia = async (mediaIds: string[]) => {
        if (mediaIds.length === 0) return;

        try {
            const result = await getChatsContainingMedia(mediaIds);
            if (result.error) {
                console.error(
                    'Failed to prefetch chats with media:',
                    result.error,
                );
                return;
            }

            // Add the prefetched chats to the cache if they're not already there
            const existingChatIds = new Set(
                chats.map((chat) => chat?.id).filter(Boolean),
            );
            const newChats = (result.chats || []).filter(
                (chat) => chat && !existingChatIds.has(chat.id),
            );

            if (newChats.length > 0) {
                queryClient.setQueryData(['chats'], (oldData: any) => {
                    if (!oldData?.pages) return oldData;

                    // Add new chats to the first page
                    const firstPage = oldData.pages[0];
                    if (firstPage) {
                        return {
                            ...oldData,
                            pages: [
                                {
                                    ...firstPage,
                                    chats: [...newChats, ...firstPage.chats],
                                },
                                ...oldData.pages.slice(1),
                            ],
                        };
                    }

                    return oldData;
                });
            }
        } catch (error) {
            console.error('Error prefetching chats with media:', error);
        }
    };

    return {
        chats,
        currentChat,
        isLoadingChats,
        isLoadingMessages: isLoadingCurrentChat,
        chatsError,
        currentChatError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        prefetchChatsWithMedia,
        refetch: () => {
            refetchChats();
            if (chatId) {
                queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
            }
        },
        createChat: createChatMutation.mutateAsync,
        updateChat: updateChatMutation.mutateAsync,
        deleteChat: deleteChatMutation.mutateAsync,
        isCreatingChat: createChatMutation.isPending,
        isUpdatingChat: updateChatMutation.isPending,
        isDeletingChat: deleteChatMutation.isPending,
    };
}
