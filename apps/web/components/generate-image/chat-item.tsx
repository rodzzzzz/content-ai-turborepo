'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ImageChat } from '@prisma/client';

interface ChatItemProps {
    chat: ImageChat;
    chatHasSelectedMedia: boolean;
    handleDeleteClick: (
        e: React.MouseEvent,
        chat: { id: string; title: string },
    ) => void;
    handleChatSelect: (chatId: string) => void;
    isSelected: boolean;
}

export const ChatItem = memo<ChatItemProps>(
    ({
        chat,
        chatHasSelectedMedia,
        handleDeleteClick,
        handleChatSelect,
        isSelected,
    }) => {
        return (
            <div key={chat.id} className="group relative">
                <div
                    className={cn(
                        'flex w-full cursor-pointer items-center gap-2 rounded-md p-3 pr-6 transition-colors hover:bg-accent hover:text-accent-foreground',
                        isSelected && 'bg-accent text-accent-foreground',
                    )}
                    onClick={() => handleChatSelect(chat.id)}
                >
                    <div className="flex w-full flex-col items-start gap-1">
                        <div className="flex w-full items-center gap-2">
                            <p className="line-clamp-1 flex-1 text-sm font-medium">
                                {chat.name || 'Untitled Chat'}
                            </p>
                            {chatHasSelectedMedia && (
                                <div
                                    className="flex h-2 w-2 rounded-full bg-green-500"
                                    title="Contains selected media"
                                />
                            )}
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            {`${formatDistanceToNow(new Date(chat.updatedAt))} ago`}
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-3 top-3 z-20 h-6 w-6 bg-destructive/10 text-destructive transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100 lg:opacity-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteClick(e, {
                            id: chat.id,
                            title: chat.name || 'Untitled Chat',
                        });
                    }}
                >
                    <TrashIcon
                        style={{
                            width: 12,
                            height: 12,
                        }}
                    />
                </Button>
            </div>
        );
    },
);

ChatItem.displayName = 'ChatItem';
