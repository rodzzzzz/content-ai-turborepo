'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import {
    StickToBottom,
    useStickToBottomContext,
} from '@/contexts/stick-to-bottom-context';

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export const Conversation = ({ className, ...props }: ConversationProps) => (
    <StickToBottom
        className={cn('relative flex-1 overflow-y-auto', className)}
        initial="smooth"
        resize="smooth"
        role="log"
        {...props}
    />
);

export type ConversationContentProps = ComponentProps<
    typeof StickToBottom.Content
>;

export const ConversationContent = ({
    className,
    ...props
}: ConversationContentProps) => (
    <StickToBottom.Content
        className={cn('p-2 md:px-4', className)}
        {...props}
    />
);

export type ConversationEmptyStateProps = ComponentProps<'div'> & {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
    className,
    title = 'No messages yet',
    description = 'Start a conversation to see messages here',
    icon,
    children,
    ...props
}: ConversationEmptyStateProps) => (
    <div
        className={cn(
            'flex size-full flex-col items-center justify-center gap-3 p-8 text-center',
            className,
        )}
        {...props}
    >
        {children ?? (
            <>
                {icon && <div className="text-muted-foreground">{icon}</div>}
                <div className="space-y-1">
                    <h3 className="text-sm font-medium">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </>
        )}
    </div>
);

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
    className,
    ...props
}: ConversationScrollButtonProps) => {
    const { isAtBottom, scrollToBottom, isAtTop } = useStickToBottomContext();

    const handleScrollToBottom = useCallback(() => {
        scrollToBottom();
    }, [scrollToBottom]);

    return (
        <>
            {!isAtTop && (
                <div className="absolute left-0 top-0 z-10 h-20 w-full bg-gradient-to-b from-background to-transparent" />
            )}
            {!isAtBottom && (
                <div className="absolute bottom-0 left-0 z-10 h-20 w-full bg-gradient-to-t from-background to-transparent">
                    <Button
                        className={cn(
                            'absolute bottom-4 left-[50%] translate-x-[-50%] animate-bounce rounded-full',
                            className,
                        )}
                        onClick={handleScrollToBottom}
                        size="icon"
                        type="button"
                        variant="outline"
                        {...props}
                    >
                        <ChevronDownIcon className="size-4" />
                    </Button>
                </div>
            )}
        </>
    );
};
