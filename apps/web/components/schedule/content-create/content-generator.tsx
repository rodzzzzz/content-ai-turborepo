'use client';

import { useCompletion } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    SparklesIcon,
    StopCircle,
    ArrowUpIcon,
    Loader2Icon,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { AutoResizeTextarea } from '@/components/ui/autoresize-textarea';
import { MagicShadow } from '@/components/ui/magic-shadow';
import { useSubscription } from '@/contexts/subscription-context';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContentGeneratorProps {
    onContentGenerated: (content: string) => void;
    disabled?: boolean;
    setIsAIGenerating: React.Dispatch<React.SetStateAction<boolean>>;
    platform: string;
    contentMaxLength: number;
}

export function ContentGenerator({
    onContentGenerated,
    disabled = false,
    setIsAIGenerating,
    platform,
    contentMaxLength,
}: ContentGeneratorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [lastGeneratedContent, setLastGeneratedContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {
        hasCredits,
        isLoading: isLoadingSubscription,
        refetch: refetchSubscription,
    } = useSubscription();

    const {
        completion,
        complete: generateContent,
        isLoading,
        setCompletion,
        stop,
    } = useCompletion({
        api: '/api/generate-content',
        onFinish: () => {
            setIsOpen(false);
            setPrompt('');
            setLastGeneratedContent('');
            // Reset completion after finishing
            setCompletion('');
            setIsAIGenerating(false);

            refetchSubscription();
        },
        onError: (error) => {
            console.error('Error generating content:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate content. Please try again.',
                variant: 'destructive',
            });
            setIsOpen(false);
            setIsAIGenerating(false);
        },
    });

    // Handle popover open state changes
    const handleOpenChange = (open: boolean) => {
        // Only allow closing if we're not loading
        if (!isLoading) {
            setIsOpen(open);
        }
    };

    // Memoize the callback to prevent unnecessary re-renders
    const handleContentGenerated = useCallback(
        (content: string) => {
            if (content !== lastGeneratedContent) {
                setLastGeneratedContent(content);
                onContentGenerated(content);
            }
        },
        [lastGeneratedContent, onContentGenerated],
    );

    // Use useEffect to handle the completion updates
    useEffect(() => {
        if (completion && completion !== lastGeneratedContent) {
            handleContentGenerated(completion);
        }
    }, [completion, lastGeneratedContent, handleContentGenerated]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!prompt.trim()) return;

        setIsAIGenerating(true);

        try {
            await generateContent(prompt, {
                body: {
                    platform,
                    contentMaxLength,
                },
            });
        } catch (error) {
            console.error('Error generating content:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const handleFormClick = useCallback((e: React.MouseEvent) => {
        // Only focus if the click is directly on the form or its immediate children
        // This prevents focusing when clicking on buttons or other interactive elements
        if (e.target === e.currentTarget || e.target === textareaRef.current) {
            textareaRef.current?.focus();
        }
    }, []);

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange} modal>
            <PopoverTrigger asChild>
                <Button variant="outline" type="button" disabled={disabled}>
                    <SparklesIcon className="h-4 w-4" />
                    Generate using AI
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[350px] border-none p-0 md:w-[500px]"
            >
                <MagicShadow variant={isLoading ? 'none' : 'default'}>
                    <form
                        onSubmit={handleSubmit}
                        onClick={handleFormClick}
                        className="group relative flex flex-1 cursor-text flex-col gap-2 rounded border border-input bg-background px-3 py-2 text-sm"
                    >
                        <AutoResizeTextarea
                            ref={textareaRef}
                            onKeyDown={handleKeyDown}
                            value={prompt}
                            onChange={(v) => setPrompt(v)}
                            placeholder="Ask the content creation agent to create content..."
                            className="max-h-36 min-h-20 bg-transparent py-1.5 placeholder:text-muted-foreground focus:outline-none"
                            disabled={isLoading}
                            autoFocus
                        />

                        <div
                            className="flex w-full justify-end group-disabled:cursor-default"
                            onClick={handleFormClick}
                        >
                            {isLoading ? (
                                <Button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        stop();
                                        setIsAIGenerating(false);
                                    }}
                                >
                                    <StopCircle className="h-4 w-4" />
                                    Stop
                                </Button>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    isLoadingSubscription ||
                                                    !prompt.trim() ||
                                                    !hasCredits()
                                                }
                                            >
                                                {isLoadingSubscription ? (
                                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ArrowUpIcon className="h-4 w-4" />
                                                )}
                                                Send
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {!hasCredits() &&
                                        !isLoadingSubscription && (
                                            <TooltipContent>
                                                Insufficient credits. Purchase
                                                more to continue.
                                            </TooltipContent>
                                        )}
                                </Tooltip>
                            )}
                        </div>
                    </form>
                </MagicShadow>
            </PopoverContent>
        </Popover>
    );
}
