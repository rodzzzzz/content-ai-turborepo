'use client';

import { useRef, useCallback, SetStateAction, Dispatch } from 'react';
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
    Loader2,
    SparklesIcon,
    XIcon,
} from 'lucide-react';
import { UIMessage } from '@ai-sdk/react';
import { memo } from 'react';
import { DateRange } from 'react-day-picker';
import { UIDataTypes, UITools } from 'ai';
import { Platform } from '@prisma/client';
import { CampaignChatSettings } from './campaign-chat-settings';
import { PromptTools } from './prompt-tools';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useSubscription } from '@/contexts/subscription-context';

interface ChatFormProps {
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    imageUrl: string[];
    setImageUrl: Dispatch<SetStateAction<string[]>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    status: 'idle' | 'ready' | 'submitted' | 'streaming' | 'error';
    stop: () => void;
    setMessages?: (
        messages:
            | UIMessage<unknown, UIDataTypes, UITools>[]
            | ((
                  messages: UIMessage<unknown, UIDataTypes, UITools>[],
              ) => UIMessage<unknown, UIDataTypes, UITools>[]),
    ) => void;
    selectedPlatforms: Platform[];
    setSelectedPlatforms: (
        value: Platform[] | ((prev: Platform[]) => Platform[]),
    ) => void;
    dateRange: DateRange | undefined;
    setDateRange: (value: DateRange | undefined) => void;
    placeholder?: string;
    deepResearch: boolean;
    gatherCompanyKnowledge: boolean;
    setDeepResearch: Dispatch<SetStateAction<boolean>>;
    setGatherCompanyKnowledge: Dispatch<SetStateAction<boolean>>;
    includeBlogPosts: boolean;
    setIncludeBlogPosts: Dispatch<SetStateAction<boolean>>;
}

export function ChatForm({
    input,
    setInput,
    imageUrl,
    setImageUrl,
    handleSubmit,
    handleKeyDown,
    status,
    stop,
    setMessages,
    selectedPlatforms,
    setSelectedPlatforms,
    dateRange,
    setDateRange,
    placeholder = 'Tell me about your campaign...',
    deepResearch,
    gatherCompanyKnowledge,
    setDeepResearch,
    setGatherCompanyKnowledge,
    // includeBlogPosts,
    // setIncludeBlogPosts,
}: ChatFormProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // const fileInputRef = useRef<HTMLInputElement>(null);
    const { hasCredits, isLoading: isLoadingSubscription } = useSubscription();

    const handleFormClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget || e.target === textareaRef.current) {
            textareaRef.current?.focus();
        }
    }, []);

    if (deepResearch) {
        placeholder = 'What do you want to research?';
    }

    // TODO: Implement using images later
    // const handlePaste = useCallback(
    //     async (e: ClipboardEvent) => {
    //         const items = e.clipboardData?.items;
    //         if (!items) return;

    //         for (let i = 0; i < items.length; i++) {
    //             const item = items[i];
    //             if (item.type.startsWith('image/')) {
    //                 e.preventDefault();
    //                 const file = item.getAsFile();
    //                 if (file) {
    //                     try {
    //                         // Convert file to data URL
    //                         const reader = new FileReader();
    //                         reader.onload = (event) => {
    //                             const dataUrl = event.target?.result as string;
    //                             if (dataUrl) {
    //                                 setImageUrl((prev) => [...prev, dataUrl]);
    //                             }
    //                         };
    //                         reader.readAsDataURL(file);
    //                     } catch (error) {
    //                         console.error(
    //                             'Error processing pasted image:',
    //                             error,
    //                         );
    //                     }
    //                 }
    //             }
    //         }
    //     },
    //     [setImageUrl],
    // );

    // const handleFileUpload = useCallback(
    //     (e: React.ChangeEvent<HTMLInputElement>) => {
    //         const files = e.target.files;
    //         if (!files) return;

    //         Array.from(files).forEach((file) => {
    //             if (file.type.startsWith('image/')) {
    //                 const reader = new FileReader();
    //                 reader.onload = (event) => {
    //                     const dataUrl = event.target?.result as string;
    //                     if (dataUrl) {
    //                         setImageUrl((prev) => [...prev, dataUrl]);
    //                     }
    //                 };
    //                 reader.readAsDataURL(file);
    //             }
    //         });

    //         // Reset the input value so the same file can be selected again
    //         e.target.value = '';
    //     },
    //     [setImageUrl],
    // );

    // const handleImageButtonClick = useCallback(() => {
    //     fileInputRef.current?.click();
    // }, []);

    // useEffect(() => {
    //     const textarea = textareaRef.current;

    //     if (textarea) {
    //         textarea.addEventListener('paste', handlePaste);
    //     }

    //     return () => {
    //         if (textarea) {
    //             textarea.removeEventListener('paste', handlePaste);
    //         }
    //     };
    // }, [handlePaste]);

    return (
        <form
            onSubmit={handleSubmit}
            onClick={handleFormClick}
            className="relative flex w-full flex-col rounded-lg"
        >
            <div className="relative flex w-full items-end gap-2 px-2">
                <div
                    className={cn(
                        'flex h-fit w-fit flex-shrink-0 cursor-pointer items-center gap-1 rounded-t-lg border border-b-0 bg-accent px-2 py-2 text-xs font-medium transition-colors duration-200',
                        deepResearch &&
                            'border-blue-500 bg-blue-100 text-blue-500',
                    )}
                    onClick={() => setDeepResearch((prev) => !prev)}
                >
                    <SparklesIcon className="h-3 w-3 fill-blue-100 stroke-blue-500" />
                    Deep Research Mode
                </div>

                {/* TODO: Implement using images later */}
                {/* Hidden file input for image uploads */}
                {/* <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                /> */}
                <AnimatePresence initial={false}>
                    {!isEmpty(imageUrl) && (
                        <motion.div
                            className="w-full"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ duration: 0.1, ease: 'linear' }}
                        >
                            <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-b-0 bg-accent p-1">
                                {imageUrl.map((url, index) => (
                                    <Tooltip key={`chat-image-${index}`}>
                                        <TooltipTrigger>
                                            <Image
                                                src={url}
                                                alt="Image"
                                                className="h-8 w-8 rounded"
                                                width={100}
                                                height={100}
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
                                    disabled={
                                        status === 'submitted' ||
                                        status === 'streaming'
                                    }
                                >
                                    <XIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div
                className={cn(
                    'relative flex cursor-text flex-col rounded-lg border border-primary bg-background text-sm transition-colors duration-200 focus-within:outline-none focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-0',
                    deepResearch &&
                        'border-blue-500 shadow-md shadow-blue-500/20 focus-within:ring-blue-500',
                )}
            >
                <AutoResizeTextarea
                    id="chat-form-textarea"
                    ref={textareaRef}
                    onKeyDown={handleKeyDown}
                    value={input}
                    onChange={(v) => setInput(v)}
                    placeholder={placeholder}
                    className="my-4 min-h-16 bg-transparent px-4 placeholder:text-muted-foreground focus:outline-none"
                    disabled={status === 'submitted' || status === 'streaming'}
                    autoFocus
                />

                <Separator />

                <div
                    className={cn(
                        'flex w-full justify-between rounded-b-lg bg-accent p-3 transition-colors duration-200',
                        deepResearch && 'bg-blue-50',
                    )}
                    onClick={handleFormClick}
                >
                    <div className="flex gap-1">
                        {/* TODO: Implement using images later */}
                        {/* <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={status === 'submitted' || status === 'streaming'}
                            className="flex-shrink-0"
                            onClick={handleImageButtonClick}
                            type="button"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </Button> */}

                        <CampaignChatSettings
                            selectedPlatforms={selectedPlatforms}
                            setSelectedPlatforms={setSelectedPlatforms}
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            disabled={
                                status === 'submitted' || status === 'streaming'
                            }
                            // includeBlogPosts={includeBlogPosts}
                            // setIncludeBlogPosts={setIncludeBlogPosts}
                        />
                    </div>
                    <div className="flex gap-1">
                        <PromptTools
                            input={input}
                            setInput={setInput}
                            gatherCompanyKnowledge={gatherCompanyKnowledge}
                            setGatherCompanyKnowledge={
                                setGatherCompanyKnowledge
                            }
                            deepResearch={deepResearch}
                            disabled={
                                status === 'submitted' || status === 'streaming'
                            }
                        />
                        {status === 'submitted' || status === 'streaming' ? (
                            <StopButton
                                stop={stop}
                                setMessages={setMessages!}
                            />
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div>
                                        <Button
                                            size="icon-sm"
                                            type="submit"
                                            className={cn(
                                                'transition-colors duration-200',
                                                deepResearch &&
                                                    'bg-blue-500 text-white hover:bg-blue-600',
                                            )}
                                            disabled={
                                                isLoadingSubscription ||
                                                !input.trim() ||
                                                selectedPlatforms.length ===
                                                    0 ||
                                                !hasCredits()
                                            }
                                        >
                                            {isLoadingSubscription ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ArrowUpIcon className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TooltipTrigger>
                                {!hasCredits() && !isLoadingSubscription && (
                                    <TooltipContent side="left">
                                        Insufficient credits. Purchase more to
                                        continue.
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
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
            size="sm"
            onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                stop();
                setMessages((messages) => messages);
            }}
        >
            <CircleStopIcon className="h-4 w-4" />
            Stop
        </Button>
    );
}

const StopButton = memo(PureStopButton);
