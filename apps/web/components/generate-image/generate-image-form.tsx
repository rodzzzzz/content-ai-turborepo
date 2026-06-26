'use client';

import {
    useRef,
    useCallback,
    useEffect,
    Dispatch,
    SetStateAction,
} from 'react';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/autoresize-textarea';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    ArrowUpIcon,
    CircleStopIcon,
    ImageIcon,
    Loader2Icon,
    XIcon,
} from 'lucide-react';
import { UIMessage } from '@ai-sdk/react';
import { memo } from 'react';
import { ImagePreferences, ImagePreferencesType } from './image-preferences';
import { ImageDescriptionImprover } from './image-description-improver';
import { UIDataTypes, UITools } from 'ai';
import { isEmpty } from 'lodash';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useSubscription } from '@/contexts/subscription-context';

interface GenerateImageFormProps {
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    imageUrl: string[];
    setImageUrl: Dispatch<SetStateAction<string[]>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    status: 'idle' | 'ready' | 'submitted' | 'streaming' | 'error';
    stop?: () => void;
    messagesLength: number;
    setMessages?: (
        messages:
            | UIMessage<unknown, UIDataTypes, UITools>[]
            | ((
                  messages: UIMessage<unknown, UIDataTypes, UITools>[],
              ) => UIMessage<unknown, UIDataTypes, UITools>[]),
    ) => void;
    mediaSuggestion?: string;
    imagePrompt?: string;
    socialPost: string;
    preferences: ImagePreferencesType;
    onPreferencesChange?: (preferences: ImagePreferencesType) => void;
    replyToImage?: { id: string; url: string } | null;
    onCancelReply?: () => void;
}

function PureStopButton({
    stop,
    setMessages,
}: {
    stop: () => void;
    setMessages: (
        messages:
            | UIMessage<unknown, UIDataTypes, UITools>[]
            | ((
                  messages: UIMessage<unknown, UIDataTypes, UITools>[],
              ) => UIMessage<unknown, UIDataTypes, UITools>[]),
    ) => void;
}) {
    return (
        <Button
            data-testid="stop-button"
            size="icon-sm"
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                stop();
                setMessages((messages) => messages);
            }}
        >
            <CircleStopIcon className="h-4 w-4" />
        </Button>
    );
}

const StopButton = memo(PureStopButton);

export function GenerateImageForm({
    input,
    setInput,
    imageUrl,
    setImageUrl,
    handleSubmit,
    handleKeyDown,
    status,
    stop,
    setMessages,
    messagesLength,
    onPreferencesChange,
    preferences,
    imagePrompt,
    mediaSuggestion,
    socialPost,
    replyToImage,
    onCancelReply,
}: GenerateImageFormProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { hasCredits, isLoading: isLoadingSubscription } = useSubscription();

    const handleFormClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget || e.target === textareaRef.current) {
            textareaRef.current?.focus();
        }
    }, []);

    const handlePreferencesChange = useCallback(
        (newPreferences: ImagePreferencesType) => {
            onPreferencesChange?.(newPreferences);
        },
        [onPreferencesChange],
    );

    const handlePaste = useCallback(
        async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        try {
                            // Convert file to data URL
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                if (dataUrl) {
                                    setImageUrl((prev) => [...prev, dataUrl]);
                                }
                            };
                            reader.readAsDataURL(file);
                        } catch (error) {
                            console.error(
                                'Error processing pasted image:',
                                error,
                            );
                        }
                    }
                }
            }
        },
        [setImageUrl],
    );

    const handleFileUpload = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;

            Array.from(files).forEach((file) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        if (dataUrl) {
                            setImageUrl((prev) => [...prev, dataUrl]);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Reset the input value so the same file can be selected again
            e.target.value = '';
        },
        [setImageUrl],
    );

    const handleImageButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    useEffect(() => {
        const textarea = textareaRef.current;

        if (textarea) {
            textarea.addEventListener('paste', handlePaste);
        }

        return () => {
            if (textarea) {
                textarea.removeEventListener('paste', handlePaste);
            }
        };
    }, [handlePaste]);

    return (
        <div className="relative flex w-full flex-col gap-2">
            {/* Reply mode indicator */}
            {replyToImage && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Image
                            src={replyToImage.url}
                            alt="Replying to"
                            className="h-8 w-8 rounded object-cover"
                            width={32}
                            height={32}
                        />
                        <span className="text-sm text-muted-foreground">
                            Replying to image
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancelReply}
                        className="ml-auto h-6 px-2 text-xs"
                    >
                        Cancel
                    </Button>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                onClick={handleFormClick}
                className="relative flex w-full flex-col rounded-lg"
            >
                {/* Hidden file input for image uploads */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <AnimatePresence initial={false}>
                    {!isEmpty(imageUrl) && (
                        <motion.div
                            className="w-full px-2"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.1, ease: 'linear' }}
                        >
                            <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 bg-muted p-1">
                                {imageUrl.map((url, index) => (
                                    <Tooltip key={`chat-image-${index}`}>
                                        <TooltipTrigger>
                                            <Image
                                                src={url}
                                                alt="Image"
                                                className="h-8 w-8 rounded"
                                                width={32}
                                                height={32}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            className="border p-0"
                                        >
                                            <Image
                                                src={url}
                                                alt="Image"
                                                className="max-w-xs rounded"
                                                width={100}
                                                height={100}
                                            />
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                                <Button
                                    variant="destructive"
                                    size="icon-xs"
                                    className="ml-auto mr-1.5 rounded-full bg-destructive/80 p-0.5"
                                    type="button"
                                    onClick={() => setImageUrl([])}
                                    disabled={status !== 'ready'}
                                >
                                    <XIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative flex cursor-text flex-col rounded-lg border border-input bg-background text-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0">
                    <AutoResizeTextarea
                        ref={textareaRef}
                        onKeyDown={handleKeyDown}
                        value={input}
                        onChange={(v) => setInput(v)}
                        className="my-4 min-h-12 bg-transparent px-4 placeholder:text-muted-foreground focus:outline-none"
                        disabled={status !== 'ready'}
                        placeholder={
                            replyToImage
                                ? 'Describe the changes you want to make...'
                                : imagePrompt && messagesLength === 0
                                  ? `Click TAB to enter the prompt: ${imagePrompt}`
                                  : 'Describe the image you want to create...'
                        }
                        autoFocus
                    />

                    <Separator />

                    <div
                        className="flex w-full justify-between rounded-b-lg bg-accent p-3"
                        onClick={handleFormClick}
                    >
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        disabled={status !== 'ready'}
                                        className="flex-shrink-0"
                                        onClick={handleImageButtonClick}
                                        type="button"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    Click to upload or paste images (Ctrl+V)
                                </TooltipContent>
                            </Tooltip>

                            <ImagePreferences
                                preferences={preferences}
                                onPreferencesChange={handlePreferencesChange}
                                disabled={status !== 'ready'}
                            />
                        </div>

                        <div className="flex gap-2">
                            <ImageDescriptionImprover
                                currentInput={input}
                                onImprovedDescription={(
                                    improvedDescription,
                                ) => {
                                    setInput(improvedDescription);
                                }}
                                disabled={status !== 'ready'}
                                socialPost={socialPost}
                                mediaSuggestion={mediaSuggestion}
                            />
                            {status !== 'ready' ? (
                                <StopButton
                                    stop={stop!}
                                    setMessages={setMessages!}
                                />
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <Button
                                                size="icon-sm"
                                                type="submit"
                                                disabled={
                                                    isLoadingSubscription ||
                                                    !input.trim() ||
                                                    !hasCredits()
                                                }
                                            >
                                                {isLoadingSubscription ? (
                                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ArrowUpIcon className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                        {!hasCredits() && !isLoadingSubscription
                                            ? 'Insufficient credits. Purchase more to continue.'
                                            : 'Submit'}
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
