'use client';

import { useCompletion } from '@ai-sdk/react';
import { Button, MagicButton } from '@/components/ui/button';
import { WandSparklesIcon, Loader2, Undo2Icon } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface ImageDescriptionImproverProps {
    currentInput: string;
    onImprovedDescription: (improvedDescription: string) => void;
    disabled?: boolean;
    socialPost: string;
    mediaSuggestion?: string;
}

export function ImageDescriptionImprover({
    currentInput,
    onImprovedDescription,
    disabled = false,
    socialPost,
    mediaSuggestion,
}: ImageDescriptionImproverProps) {
    const [isImproving, setIsImproving] = useState(false);
    const [originalDescription, setOriginalDescription] = useState<
        string | null
    >(null);
    const [showUndo, setShowUndo] = useState(false);

    const {
        completion,
        complete: improveDescription,
        setCompletion,
    } = useCompletion({
        api: '/api/improve-image-description',
        body: {
            original_description: currentInput,
            social_post: socialPost,
            media_suggestion: mediaSuggestion || '',
        },
        onFinish: () => {
            setIsImproving(false);
            // Reset completion after finishing
            setCompletion('');
            // Show undo button after improvement
            setShowUndo(true);
        },
        onError: (error) => {
            console.error('Error improving image description:', error);
            toast({
                title: 'Error',
                description:
                    'Failed to improve image description. Please try again.',
                variant: 'destructive',
            });
            setIsImproving(false);
            setShowUndo(false);
        },
    });

    // Update the input with the improved description as it streams in
    useEffect(() => {
        if (completion && isImproving) {
            onImprovedDescription(completion);
        }
    }, [completion, isImproving, onImprovedDescription]);

    // Set showUndo to false if the user changes the input
    useEffect(() => {
        setShowUndo(false);
    }, [currentInput]);

    const handleImproveDescription = async () => {
        if (!currentInput.trim() || isImproving) return;

        // Store the original description before improvement
        setOriginalDescription(currentInput);
        setIsImproving(true);
        setShowUndo(false);

        try {
            console.log('currentInput', currentInput);
            console.log('socialPost', socialPost);
            console.log('mediaSuggestion', mediaSuggestion);
            await improveDescription('');
        } catch (error) {
            console.error('Error improving image description:', error);
            setIsImproving(false);
        }
    };

    const handleUndo = () => {
        if (originalDescription) {
            onImprovedDescription(originalDescription);
            setShowUndo(false);
            setOriginalDescription(null);
        }
    };

    return (
        <div>
            {showUndo ? (
                <Button
                    variant="outline"
                    type="button"
                    onClick={handleUndo}
                    disabled={disabled}
                >
                    <Undo2Icon className="h-4 w-4" />
                    Undo
                </Button>
            ) : (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <MagicButton
                            size="icon-sm"
                            variant={isImproving ? 'default' : 'outline'}
                            shadowVariant={isImproving ? 'animated' : 'outline'}
                            type="button"
                            disabled={
                                disabled || isImproving || !currentInput.trim()
                            }
                            onClick={handleImproveDescription}
                        >
                            {isImproving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <WandSparklesIcon size={16} />
                            )}
                        </MagicButton>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                        Enhance image description
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
