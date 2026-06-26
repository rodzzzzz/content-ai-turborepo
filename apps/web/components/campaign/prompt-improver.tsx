'use client';

import { useCompletion } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { WandSparklesIcon, Loader2, Undo2Icon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PromptImproverProps {
    currentInput: string;
    onImprovedPrompt: (improvedPrompt: string) => void;
    disabled?: boolean;
}

export function PromptImprover({
    currentInput,
    onImprovedPrompt,
    disabled = false,
}: PromptImproverProps) {
    const [isImproving, setIsImproving] = useState(false);
    const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
    const [showUndo, setShowUndo] = useState(false);

    const {
        completion,
        complete: improvePrompt,
        setCompletion,
    } = useCompletion({
        api: '/api/improve-prompt',
        onFinish: () => {
            setIsImproving(false);
            // Reset completion after finishing
            setCompletion('');
            // Show undo button after improvement
            setShowUndo(true);
        },
        onError: (error) => {
            console.error('Error improving prompt:', error);
            toast({
                title: 'Error',
                description: 'Failed to improve prompt. Please try again.',
                variant: 'destructive',
            });
            setIsImproving(false);
            setShowUndo(false);
        },
    });

    // Update the input with the improved prompt as it streams in
    useEffect(() => {
        if (completion && isImproving) {
            onImprovedPrompt(completion);
        }
    }, [completion, isImproving, onImprovedPrompt]);

    // Set showUndo to false if the user changes the input
    useEffect(() => {
        setShowUndo(false);
    }, [currentInput]);

    const handleImprovePrompt = async () => {
        if (!currentInput.trim() || isImproving) return;

        // Store the original prompt before improvement
        setOriginalPrompt(currentInput);
        setIsImproving(true);
        setShowUndo(false);

        try {
            console.log('currentInput', currentInput);
            await improvePrompt(currentInput);
        } catch (error) {
            console.error('Error improving prompt:', error);
            setIsImproving(false);
        }
    };

    const handleUndo = () => {
        if (originalPrompt) {
            onImprovedPrompt(originalPrompt);
            setShowUndo(false);
            setOriginalPrompt(null);
        }
    };

    return (
        <>
            {showUndo ? (
                <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleUndo}
                    className="h-fit w-full justify-start p-2 text-xs"
                >
                    <Undo2Icon className="h-4 w-4" />
                    Undo Prompt Improvement
                </Button>
            ) : (
                <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    className={cn(
                        'h-fit w-full justify-start p-2 text-xs',
                        isImproving && 'animate-pulse',
                    )}
                    disabled={disabled || isImproving || !currentInput.trim()}
                    onClick={handleImprovePrompt}
                >
                    {isImproving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <WandSparklesIcon className="h-4 w-4 stroke-yellow-500" />
                    )}
                    Improve Prompt
                </Button>
            )}
        </>
    );
}
