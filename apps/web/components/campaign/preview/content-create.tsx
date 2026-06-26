import { AutoResizeTextarea } from '@/components/ui/autoresize-textarea';
import { Button } from '@/components/ui/button';
import { MagicShadow } from '@/components/ui/magic-shadow';
import { toast } from '@/hooks/use-toast';
import { useCompletion } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpIcon, Loader2Icon, StopCircle } from 'lucide-react';
import { SetStateAction, Dispatch, useCallback, useRef, useState } from 'react';
import { ContentItem } from '@/types/campaign';
import { useCampaignPreview } from '@/contexts/campaign-preview-context';
import { useSubscription } from '@/contexts/subscription-context';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

export const ContentCreate = ({
    contentCopyPrompt,
    platform,
    content,
    setContent,
}: {
    contentCopyPrompt: string;
    platform: string;
    content: ContentItem;
    setContent: Dispatch<SetStateAction<ContentItem | null>>;
}) => {
    const [prompt, setPrompt] = useState(contentCopyPrompt);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { updateContent, isUpdatingCampaignContent: isSaving } =
        useCampaignPreview();
    const {
        hasCredits,
        isLoading: isLoadingSubscription,
        refetch: refetchSubscription,
    } = useSubscription();

    const {
        completion: generatedContent,
        complete: generateContent,
        isLoading,
        stop,
    } = useCompletion({
        api: '/api/generate-content',
        onFinish: async (_, output) => {
            await handleSaveContent(output);
            refetchSubscription();
        },
        onError: (error) => {
            console.error('Error generating content:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate content. Please try again.',
                variant: 'destructive',
            });
        },
    });

    const handleSaveContent = async (output: string) => {
        if (output) {
            await updateContent(content.id, {
                ...content,
                content: output,
                status: 'created',
            });

            setContent((prev) => ({
                ...prev!,
                content: output,
                status: 'created',
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!prompt.trim()) return;

        try {
            await generateContent(prompt, {
                body: {
                    platform,
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
        <div className="mx-auto flex h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 p-4 text-center">
            {isSaving ? (
                <div className="flex animate-pulse flex-col items-center justify-center gap-1">
                    <h3 className="text-xl font-semibold">Saving content...</h3>
                    <p className="text-sm text-muted-foreground">
                        Please wait while we save the content.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                    <h3 className="text-xl font-semibold">
                        No content created yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Please use the prompt below to create a content.
                    </p>
                </div>
            )}

            <AnimatePresence initial={false}>
                {generatedContent && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <div className="relative h-full w-full">
                            <div
                                ref={(el) => {
                                    if (el) {
                                        el.scrollTop = el.scrollHeight;
                                    }
                                }}
                                className="scrollbar-hide relative h-full max-h-48 w-full overflow-y-auto scroll-smooth whitespace-pre-wrap text-left text-sm text-muted-foreground"
                            >
                                {generatedContent}
                            </div>
                            <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-b from-background via-transparent to-background" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <MagicShadow
                variant={isLoading ? 'animated-sm' : 'none'}
                isFullWidth
            >
                <form
                    onSubmit={handleSubmit}
                    onClick={handleFormClick}
                    className="group relative flex cursor-text flex-col gap-4 rounded border border-input bg-background px-3 py-2 text-sm"
                >
                    <AutoResizeTextarea
                        ref={textareaRef}
                        onKeyDown={handleKeyDown}
                        value={prompt}
                        onChange={(v) => setPrompt(v)}
                        placeholder="Ask the content creation agent to create content..."
                        className="max-h-36 min-h-20 bg-transparent py-1.5 placeholder:text-muted-foreground focus:outline-none"
                        disabled={isLoading || isSaving}
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
                                    // setIsAIGenerating(false);
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
                                                isSaving ||
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
                                {!hasCredits() && !isLoadingSubscription && (
                                    <TooltipContent side="left">
                                        Insufficient credits. Purchase more to
                                        continue.
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )}
                    </div>
                </form>
            </MagicShadow>
        </div>
    );
};
