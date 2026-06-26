'use client';

import { useEffect, useState, Fragment, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    SparklesIcon,
    MessageSquare,
    CircleCheckIcon,
    ReplyIcon,
    CornerDownRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { GenerateImageForm } from './generate-image-form';
import { getChatById, saveChatMessage } from '@/actions/image-chat';
import { ChatSelector } from './chat-selector';
import { useQuery } from '@tanstack/react-query';
import { useImageChatStore } from '@/hooks/use-image-chat-store';
import { ImagePreferencesType } from './image-preferences';
import { DefaultChatTransport, UIMessage } from 'ai';
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from '../ai-elements/conversation';
import { Message, MessageContent } from '../ai-elements/message';
import { isEmpty } from 'lodash';
import { useUploadThing } from '@/lib/uploadthing';
import { useSubscription } from '@/contexts/subscription-context';

interface GenerateImageProps {
    onSelectMedia: (media: { id: string; url: string }[]) => void;
    maxItems: number;
    initialSelectedMedia: { id: string; url: string }[];
    onDone: () => void;
    mediaSuggestion?: string;
    imagePrompt?: string;
    socialPost: string;
}

export function GenerateImage({
    onSelectMedia,
    maxItems,
    initialSelectedMedia,
    onDone,
    mediaSuggestion,
    imagePrompt,
    socialPost,
}: GenerateImageProps) {
    const {
        createChat,
        isCreatingChat,
        refetch: refetchChats,
    } = useImageChatStore();
    const [chatId, setChatId] = useState<string | undefined>(undefined);
    const [selectedItems, setSelectedItems] = useState<
        { id: string; url: string }[]
    >(initialSelectedMedia || []);
    const { refetch: refetchSubscription } = useSubscription();

    const {
        data: currentChat,
        isLoading: isLoadingCurrentChat,
        refetch,
    } = useQuery({
        queryKey: ['chat', chatId],
        queryFn: async () => {
            const result = await getChatById(chatId || '');
            if (result.error) throw new Error(result.error);
            return result.chat;
        },
        enabled: !!chatId,
    });

    const [input, setInput] = useState('');
    const [imageUrl, setImageUrl] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [replyToImage, setReplyToImage] = useState<{
        id: string;
        url: string;
    } | null>(null);

    // Initialize preferences with default values
    const [preferences, setPreferences] = useState<ImagePreferencesType>({
        size: 'square',
    });

    // Upload thing hook for image uploads
    const { startUpload } = useUploadThing('postMediaUploader', {
        onClientUploadComplete: async () => {
            setIsUploading(false);
        },
        onUploadError: (error) => {
            console.error('Upload error:', error);
            setIsUploading(false);
            toast({
                title: 'Upload Error',
                description: 'Failed to upload images',
                variant: 'destructive',
            });
        },
    });

    const { messages, sendMessage, setMessages, status, stop } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/generate-image',
        }),
        onFinish: async (message) => {
            if (chatId && message.message.role === 'assistant') {
                try {
                    await saveChatMessage(chatId, message.message);
                    refetchChats();
                    refetchSubscription();
                } catch (error) {
                    console.error(
                        'Failed to save image generation message:',
                        error,
                    );
                    toast({
                        title: 'Error',
                        description: 'Failed to save image generation message',
                        variant: 'destructive',
                    });
                }
            }
        },
        onError: (error) => {
            console.error('Image generation error:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to generate image',
                variant: 'destructive',
            });
        },
        id: chatId,
    });

    // Load messages from current chat when it changes
    useEffect(() => {
        if (currentChat?.messages && currentChat.messages.length > 0) {
            // Convert database messages to SDK Message type
            const initialMessages = currentChat.messages.map((msg) => {
                return {
                    id: msg.id,
                    role: msg.role as UIMessage['role'],
                    parts: msg.parts as UIMessage['parts'],
                };
            });
            setMessages(initialMessages);
        } else if (chatId && !currentChat) {
            // Clear messages if chat is selected but not loaded yet
            setMessages([]);
        }
    }, [currentChat, chatId, setMessages]);

    // Refetch chat data when chatId changes
    useEffect(() => {
        if (chatId) {
            refetch();
        }
    }, [chatId, refetch]);

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

    // Function to finalize selection and call onSelectMedia
    const handleDone = () => {
        onSelectMedia(selectedItems);
        onDone();
    };

    // Handle replying to an image
    const handleReplyToImage = useCallback(
        (image: { id: string; url: string }) => {
            setReplyToImage(image);
        },
        [],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (
            !input.trim() ||
            status === 'submitted' ||
            status === 'streaming' ||
            isUploading
        )
            return;

        try {
            const messageContent = input.trim();
            let finalImageUrls: string[] = [];

            // Upload images if any are selected
            if (!isEmpty(imageUrl)) {
                setIsUploading(true);

                // Convert data URLs to File objects
                const files: File[] = [];
                for (const dataUrl of imageUrl) {
                    const response = await fetch(dataUrl);
                    const blob = await response.blob();
                    const file = new File([blob], `image-${Date.now()}.png`, {
                        type: 'image/png',
                    });
                    files.push(file);
                }

                // Upload files
                const uploadResult = await startUpload(files);
                if (uploadResult) {
                    finalImageUrls = uploadResult.map((file) => file.ufsUrl);
                }
            }

            // Send message with uploaded image URLs
            await sendMessage({
                role: 'user',
                parts: [
                    ...(replyToImage
                        ? [
                              {
                                  type: 'data-reply-to-image' as const,
                                  data: {
                                      id: replyToImage.id,
                                      url: replyToImage.url,
                                  },
                              },
                          ]
                        : []),
                    { type: 'text' as const, text: messageContent },
                    ...(finalImageUrls.length > 0
                        ? [
                              {
                                  type: 'data-attached-images' as const,
                                  data: {
                                      images: finalImageUrls,
                                  },
                              },
                          ]
                        : []),
                ],
            });

            setInput('');
            setImageUrl([]);
            setReplyToImage(null); // Clear reply state after submission
        } catch (error) {
            console.error('Failed to send message:', error);
            toast({
                title: 'Error',
                description: 'Failed to send message',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit(e as unknown as React.FormEvent);
        }

        if (
            e.key === 'Tab' &&
            imagePrompt &&
            input.trim().length === 0 &&
            !replyToImage &&
            messages.length === 0
        ) {
            e.preventDefault();
            setInput(imagePrompt);
        }
    };

    const emptyChat = (
        <header className="m-auto flex flex-col items-center text-center">
            <h1 className="text-balance text-3xl font-bold leading-none tracking-tight">
                Generate Images with AI
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Start a new chat or select from previous chats to generate
                images
            </p>

            <Button
                onClick={async () => {
                    try {
                        const result = await createChat('');
                        if (result.id) {
                            setChatId(result.id);
                        } else {
                            toast({
                                title: 'Error',
                                description: 'Failed to create new chat',
                                variant: 'destructive',
                            });
                        }
                    } catch (error) {
                        console.error('Failed to create chat:', error);
                        toast({
                            title: 'Error',
                            description: 'Failed to create new chat',
                            variant: 'destructive',
                        });
                    }
                }}
                disabled={isCreatingChat}
                className="mt-6 flex items-center"
            >
                {isCreatingChat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <MessageSquare className="h-4 w-4" />
                )}
                {isCreatingChat ? 'Creating...' : 'Start New Chat'}
            </Button>
        </header>
    );

    const header = (
        <header className="m-auto flex flex-col items-center gap-5 text-center">
            <h1 className="text-balance text-3xl font-bold leading-none tracking-tight">
                Generate Images with AI
            </h1>
            <p className="max-w-lg text-balance text-sm text-muted-foreground">
                Describe the image you want to create and I&apos;ll generate it
                for you.
            </p>
        </header>
    );

    return (
        <div className="relative flex h-full flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <ChatSelector
                        selectedChatId={chatId}
                        setSelectedChatId={setChatId}
                        selectedMedia={selectedItems}
                    />
                    {selectedItems.length > 0 && (
                        <Badge variant="secondary" className="hidden md:block">
                            {selectedItems.length} of {maxItems} items selected
                        </Badge>
                    )}
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

            {!chatId ? (
                <div className="flex h-full w-full items-center justify-center">
                    {emptyChat}
                </div>
            ) : isLoadingCurrentChat ? (
                <div className="flex h-full items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                        Loading chat...
                    </span>
                </div>
            ) : isCreatingChat ? (
                <div className="flex h-full items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                        Creating chat...
                    </span>
                </div>
            ) : (
                <>
                    {messages.length > 0 ? (
                        <Conversation className="">
                            <ConversationContent className="space-y-4">
                                {messages.map((message, index) => {
                                    return (
                                        <div key={index}>
                                            {message.parts.map((part, i) => {
                                                switch (part.type) {
                                                    case 'text':
                                                        return (
                                                            <Fragment
                                                                key={`${message.id}-${i}`}
                                                            >
                                                                <Message
                                                                    from={
                                                                        message.role
                                                                    }
                                                                >
                                                                    <MessageContent>
                                                                        <Response>
                                                                            {
                                                                                part.text
                                                                            }
                                                                        </Response>
                                                                    </MessageContent>
                                                                </Message>
                                                            </Fragment>
                                                        );
                                                    case 'data-reply-to-image':
                                                        if (
                                                            message.role ===
                                                            'assistant'
                                                        ) {
                                                            return null;
                                                        }

                                                        const replyToImageData =
                                                            part.data as {
                                                                id: string;
                                                                url: string;
                                                            };
                                                        return (
                                                            <Message
                                                                from={
                                                                    message.role
                                                                }
                                                                key={`${message.id}-${i}`}
                                                                className="flex items-center gap-2 px-2 pb-0"
                                                            >
                                                                <CornerDownRightIcon className="h-4 w-4 text-muted-foreground" />
                                                                <Image
                                                                    src={
                                                                        replyToImageData.url
                                                                    }
                                                                    alt="Reply to image"
                                                                    width={30}
                                                                    height={30}
                                                                    className="rounded-md border"
                                                                />
                                                            </Message>
                                                        );
                                                    case 'data-attached-images':
                                                        if (
                                                            message.role ===
                                                            'assistant'
                                                        ) {
                                                            return null;
                                                        }

                                                        const attachedImagesData =
                                                            part.data as {
                                                                images: string[];
                                                            };
                                                        return (
                                                            <Message
                                                                from={
                                                                    message.role
                                                                }
                                                                key={`${message.id}-${i}`}
                                                                className="flex items-center gap-1 px-2 pt-0"
                                                            >
                                                                {attachedImagesData.images.map(
                                                                    (
                                                                        image,
                                                                        index,
                                                                    ) => (
                                                                        <Image
                                                                            key={`${message.id}-${i}-${index}`}
                                                                            src={
                                                                                image
                                                                            }
                                                                            alt="Reply to image"
                                                                            width={
                                                                                30
                                                                            }
                                                                            height={
                                                                                30
                                                                            }
                                                                            className="rounded-md border"
                                                                        />
                                                                    ),
                                                                )}
                                                            </Message>
                                                        );
                                                    case 'file':
                                                        return (
                                                            <Message
                                                                key={`${message.id}-image-${i}`}
                                                                from={
                                                                    message.role
                                                                }
                                                            >
                                                                <Image
                                                                    src={
                                                                        part.url
                                                                    }
                                                                    alt="Generated Image"
                                                                    width={100}
                                                                    height={100}
                                                                />
                                                            </Message>
                                                        );
                                                    case 'data-generate-image':
                                                        const data =
                                                            part.data as {
                                                                images: {
                                                                    mediaType: string;
                                                                    url: string;
                                                                    id: string;
                                                                }[];
                                                            };
                                                        return (
                                                            <div
                                                                key={part.id}
                                                                className="grid w-fit grid-cols-1 gap-2 md:grid-cols-2"
                                                            >
                                                                {data.images.map(
                                                                    (image) => {
                                                                        const isSelected =
                                                                            image &&
                                                                            selectedItems.some(
                                                                                (
                                                                                    m,
                                                                                ) =>
                                                                                    m.id ===
                                                                                    image.id,
                                                                            );
                                                                        return (
                                                                            <div
                                                                                key={
                                                                                    image.id
                                                                                }
                                                                                className={cn(
                                                                                    'group relative h-fit w-fit overflow-hidden rounded-md',
                                                                                    isSelected &&
                                                                                        'ring-2 ring-primary ring-offset-2 transition-all duration-300',
                                                                                )}
                                                                            >
                                                                                <div
                                                                                    className={cn(
                                                                                        'absolute left-0 top-0 z-10 hidden h-full w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-gradient-to-b from-black/80 to-transparent',
                                                                                        isSelected &&
                                                                                            'flex',
                                                                                    )}
                                                                                    onClick={(
                                                                                        e,
                                                                                    ) => {
                                                                                        e.stopPropagation();
                                                                                        toggleSelection(
                                                                                            {
                                                                                                id: image.id,
                                                                                                url: image.url,
                                                                                            },
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <CircleCheckIcon className="h-4 w-4 text-white" />
                                                                                    <p className="text-sm font-medium text-white">
                                                                                        Selected
                                                                                    </p>
                                                                                </div>
                                                                                {!isSelected && (
                                                                                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gradient-to-b from-black/80 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100 group-hover:opacity-100">
                                                                                        <Button
                                                                                            variant="secondary"
                                                                                            size="sm"
                                                                                            className="bg-white/90 text-black hover:bg-white"
                                                                                            onClick={(
                                                                                                e,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                handleReplyToImage(
                                                                                                    {
                                                                                                        id: image.id,
                                                                                                        url: image.url,
                                                                                                    },
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            <ReplyIcon className="h-4 w-4" />
                                                                                            Reply
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            onClick={() => {
                                                                                                {
                                                                                                    toggleSelection(
                                                                                                        {
                                                                                                            id: image.id,
                                                                                                            url: image.url,
                                                                                                        },
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <CircleCheckIcon className="h-4 w-4" />
                                                                                            Select
                                                                                            Image
                                                                                        </Button>
                                                                                    </div>
                                                                                )}
                                                                                <Image
                                                                                    src={
                                                                                        image.url
                                                                                    }
                                                                                    alt="Generated Image"
                                                                                    width={
                                                                                        400
                                                                                    }
                                                                                    height={
                                                                                        400
                                                                                    }
                                                                                    loading="lazy"
                                                                                    data-loaded="false"
                                                                                    onLoad={(
                                                                                        event,
                                                                                    ) => {
                                                                                        event.currentTarget.setAttribute(
                                                                                            'data-loaded',
                                                                                            'true',
                                                                                        );
                                                                                    }}
                                                                                    className="h-auto w-full max-w-[400px] object-contain data-[loaded=false]:animate-pulse data-[loaded=false]:bg-muted"
                                                                                />
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        );
                                                    default:
                                                        return null;
                                                }
                                            })}
                                        </div>
                                    );
                                })}
                                {(status === 'submitted' || isUploading) && (
                                    <Message from="assistant">
                                        <MessageContent className="overflow-visible">
                                            <ThinkingMessage
                                                message={
                                                    isUploading
                                                        ? 'Uploading images...'
                                                        : 'Generating image...'
                                                }
                                            />
                                        </MessageContent>
                                    </Message>
                                )}
                            </ConversationContent>

                            <ConversationScrollButton />
                        </Conversation>
                    ) : (
                        <div className="flex h-full flex-col">{header}</div>
                    )}

                    <GenerateImageForm
                        input={input}
                        setInput={setInput}
                        imageUrl={imageUrl}
                        setImageUrl={setImageUrl}
                        handleSubmit={handleSubmit}
                        handleKeyDown={handleKeyDown}
                        status={isUploading ? 'submitted' : status}
                        stop={stop}
                        setMessages={setMessages}
                        messagesLength={messages.length}
                        preferences={preferences}
                        onPreferencesChange={setPreferences}
                        mediaSuggestion={mediaSuggestion}
                        imagePrompt={imagePrompt}
                        socialPost={socialPost}
                        replyToImage={replyToImage}
                        onCancelReply={() => {
                            setReplyToImage(null);
                            setImageUrl([]);
                        }}
                    />
                </>
            )}
        </div>
    );
}

const ThinkingMessage = ({ message = 'Thinking...' }: { message?: string }) => {
    const role = 'assistant';

    return (
        <motion.div
            data-testid="message-assistant-loading"
            className="group/message w-full"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
            data-role={role}
        >
            <div className="flex items-center gap-2 p-4">
                <div className="relative">
                    <div className="absolute -inset-0.5 animate-magic-shadow rounded-full bg-magic opacity-50 blur" />

                    <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-border before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-magic before:p-[1px]">
                        <SparklesIcon className="h-4 w-4" />
                    </div>
                </div>

                <div className="animate-pulse text-sm">{message}</div>
            </div>
        </motion.div>
    );
};
