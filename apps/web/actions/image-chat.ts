'use server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { openai } from '@ai-sdk/openai';
import { generateText, UIMessage } from 'ai';
import { revalidatePath } from 'next/cache';
import { JsonValue } from '@prisma/client/runtime/library';

export async function generateTitleFromUserMessage({
    message,
}: {
    message: UIMessage;
}) {
    const { text: title } = await generateText({
        model: openai('gpt-4o'),
        system: `\n
          - you will generate a short title based on the first message a user begins a conversation with
          - ensure it is not more than 50 characters long
          - the title should be very short and concise description of the image the user is trying to generate
          - do not use quotes or colons`,
        prompt: JSON.stringify(message),
    });

    return title;
}

export async function getMostRecentUserMessage(messages: Array<UIMessage>) {
    const userMessages = messages.filter((message) => message.role === 'user');
    return userMessages.at(-1);
}

export async function createChat(title: string) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const chat = await db.imageChat.create({
            data: {
                userId: user.id,
                organizationId: user.organizationId!,
                name: title || 'New Campaign',
            },
        });

        revalidatePath('/assistant');
        return { success: 'Chat created successfully', chat };
    } catch (error) {
        return { error: 'Failed to create chat' };
    }
}

export async function updateChat(id: string, data: { title: string }) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const chat = await db.imageChat.update({
            where: {
                id,
                userId: user.id,
            },
            data: {
                name: data.title,
            },
        });

        revalidatePath('/assistant');

        return { success: 'Chat updated successfully', chat };
    } catch (error) {
        return { error: 'Failed to update chat' };
    }
}

export async function saveChatMessage(chatId: string, message: UIMessage) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const chatMessage = await db.imageChatMessage.upsert({
            where: {
                imageChatId: chatId,
                id: message.id,
            },
            update: {
                role: message.role,
                parts: (message.parts as JsonValue) || [],
            },
            create: {
                imageChatId: chatId,
                role: message.role,
                parts: (message.parts as JsonValue) || [],
            },
        });

        return { success: 'Chat message saved successfully', chatMessage };
    } catch (error) {
        return {
            error: 'Failed to save chat message',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function getChats() {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const chats = await db.imageChat.findMany({
            where: {
                userId: user.id,
                organizationId: user.organizationId!,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return { success: 'Chats fetched successfully', chats };
    } catch (error) {
        return { error: 'Failed to get chats' };
    }
}

export async function getChatById(chatId: string) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        const chat = await db.imageChat.findUnique({
            where: {
                id: chatId,
                userId: user.id,
                organizationId: user.organizationId!,
            },
            include: {
                messages: {
                    orderBy: {
                        updatedAt: 'asc',
                    },
                },
            },
        });

        if (!chat) {
            return { error: 'Chat not found' };
        }

        return {
            success: 'Chat fetched successfully',
            chat,
        };
    } catch (error) {
        return { error: 'Failed to get chat' };
    }
}

export async function getInfiniteChats(params?: {
    limit?: number;
    cursor?: string;
}) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            return { error: 'Unauthorized' };
        }

        const { limit = 20, cursor } = params || {};

        const where: any = {
            userId: user.id,
            organizationId: user.organizationId!,
        };

        // If cursor is provided, add the filter for pagination
        if (cursor) {
            where.updatedAt = {
                lt: new Date(cursor), // Less than the cursor (for getting older items)
            };
        }

        // Fetch one more item than requested to check if there are more items
        const chats = await db.imageChat.findMany({
            where,
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            take: limit + 1,
            orderBy: {
                updatedAt: 'desc', // Newest first
            },
        });

        // Check if there are more items
        const hasNextPage = chats.length > limit;
        // Remove the extra item we fetched
        const paginatedChats = hasNextPage ? chats.slice(0, limit) : chats;

        // Get the next cursor
        const nextCursor = hasNextPage
            ? paginatedChats[paginatedChats.length - 1].updatedAt.toISOString()
            : undefined;

        return {
            success: 'Chats fetched successfully',
            chats: paginatedChats,
            hasNextPage,
            nextCursor,
        };
    } catch (error) {
        return { error: 'Failed to get chats' };
    }
}

export async function getChatsContainingMedia(mediaIds: string[]) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            return { error: 'Unauthorized' };
        }

        if (mediaIds.length === 0) {
            return { success: 'No media IDs provided', chats: [] };
        }

        // Get all chats for the user first, then filter in memory
        // This is more reliable than complex Prisma JSON queries
        const allChats = await db.imageChat.findMany({
            where: {
                userId: user.id,
                organizationId: user.organizationId!,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Filter chats that contain any of the specified media IDs
        const chatsWithMedia = allChats.filter((chat) => {
            return chat.messages.some((message) => {
                if (!message.parts || !Array.isArray(message.parts)) {
                    return false;
                }

                return message.parts.some((part: any) => {
                    if (
                        part.type !== 'data-generate-image' ||
                        !part.data?.images
                    ) {
                        return false;
                    }

                    return part.data.images.some((image: any) =>
                        mediaIds.includes(image.id),
                    );
                });
            });
        });

        return {
            success: 'Chats containing media fetched successfully',
            chats: chatsWithMedia,
        };
    } catch (error) {
        return { error: 'Failed to get chats containing media' };
    }
}

export async function deleteChat(chatId: string) {
    try {
        const user = await currentUser();

        if (!user || !user.id) {
            throw new Error('Unauthorized');
        }

        await db.imageChat.delete({
            where: {
                id: chatId,
                userId: user.id,
            },
        });

        revalidatePath('/assistant');
        return { success: 'Chat deleted successfully' };
    } catch (error) {
        return { error: 'Failed to delete chat' };
    }
}
