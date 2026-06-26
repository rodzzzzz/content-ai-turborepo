'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCompletion } from '@ai-sdk/react';
import { ArrowUpIcon, Loader2Icon, StopCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { MagicShadow } from '../ui/magic-shadow';
import { AutoResizeTextarea } from '../ui/autoresize-textarea';
import { ScrollArea } from '../ui/scroll-area';
import { useSubscription } from '@/contexts/subscription-context';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export default function PersonalityPreview() {
    const [previewPrompt, setPreviewPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
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
        stop,
    } = useCompletion({
        api: '/api/generate-content',
        onFinish: () => {
            // Only clear the prompt, keep the generated content
            setPreviewPrompt('');
            refetchSubscription();
        },
        onError: (error) => {
            console.error('Error generating preview:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate preview. Please try again.',
                variant: 'destructive',
            });
        },
    });

    // Update generated content whenever completion changes
    useEffect(() => {
        if (completion) {
            setGeneratedContent(completion);
        }
    }, [completion]);

    const handleGeneratePreview = async (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!previewPrompt.trim()) return;

        setPreviewPrompt('');

        try {
            await generateContent(previewPrompt, {
                body: {
                    platform: 'preview',
                    contentMaxLength: 500,
                },
            });
        } catch (error) {
            console.error('Error generating preview:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleGeneratePreview(e as unknown as React.FormEvent);
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
        <MagicShadow variant={isLoading ? 'animated-sm' : 'none'}>
            <Card className="relative">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                        Preview Content Creation Agent
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 p-6">
                    {generatedContent && (
                        <ScrollArea className="max-h-[350px]">
                            <p className="whitespace-pre-wrap text-sm font-normal">
                                {generatedContent}
                            </p>
                        </ScrollArea>
                    )}
                    <form
                        onSubmit={handleGeneratePreview}
                        onClick={handleFormClick}
                        className="group relative flex flex-1 cursor-text flex-col gap-2 rounded border border-input bg-background px-3 py-2 text-sm focus-within:outline-none focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0"
                    >
                        <AutoResizeTextarea
                            ref={textareaRef}
                            onKeyDown={handleKeyDown}
                            value={previewPrompt}
                            onChange={(v) => setPreviewPrompt(v)}
                            placeholder="Ask the content creation agent to create content..."
                            className="max-h-36 bg-transparent py-1.5 placeholder:text-muted-foreground focus:outline-none"
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
                                                    !previewPrompt.trim() ||
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
                </CardContent>
            </Card>
        </MagicShadow>
    );
}
