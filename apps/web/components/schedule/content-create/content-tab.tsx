'use client';

import { useFormContext } from 'react-hook-form';
import type { ContentFormValues } from './content-creator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AutoResizeTextarea } from '@/components/ui/autoresize-textarea';
import { cn } from '@/lib/utils';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { ContentGenerator } from './content-generator';
import { MagicShadow } from '@/components/ui/magic-shadow';
import { useState } from 'react';

interface ContentTabProps {
    platformSettings: {
        name: string;
        contentMaxLength: number;
        mediaMaxCount: number;
    };
    onNext: () => void;
}

export function ContentTab({ platformSettings, onNext }: ContentTabProps) {
    const [isAIGenerating, setIsAIGenerating] = useState(false);

    const {
        control,
        watch,
        formState: { errors },
    } = useFormContext<ContentFormValues>();

    const content = watch('content');

    const characterCount = content?.length || 0;
    const isOverLimit = characterCount > platformSettings.contentMaxLength;

    return (
        <div className="flex h-full flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold">Create Content</h2>
                <p className="mt-1 text-muted-foreground">
                    Write your content for {platformSettings.name}
                </p>
            </div>

            <div className="space-y-2">
                <FormField
                    control={control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <MagicShadow
                                    variant={
                                        isAIGenerating ? 'animated-sm' : 'none'
                                    }
                                >
                                    <div
                                        className={cn(
                                            'relative flex cursor-text flex-col gap-2 rounded border border-input bg-background px-3 py-2 text-sm',
                                            !isAIGenerating &&
                                                'focus-within:outline-none focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0',
                                        )}
                                    >
                                        <AutoResizeTextarea
                                            {...field}
                                            placeholder={`Write your ${platformSettings.name} post here...`}
                                            className="min-h-[250px] flex-1 bg-transparent py-1.5 placeholder:text-muted-foreground focus:outline-none"
                                            autoFocus
                                        />

                                        <Separator />

                                        <div className="flex w-full items-center gap-2">
                                            <ContentGenerator
                                                onContentGenerated={(
                                                    content,
                                                ) => {
                                                    field.onChange(content);
                                                }}
                                                disabled={isOverLimit}
                                                setIsAIGenerating={
                                                    setIsAIGenerating
                                                }
                                                platform={platformSettings.name}
                                                contentMaxLength={
                                                    platformSettings.contentMaxLength
                                                }
                                            />

                                            <p
                                                className={cn(
                                                    'ml-auto text-xs text-muted-foreground',
                                                    isOverLimit &&
                                                        'text-destructive',
                                                )}
                                            >
                                                {`${characterCount} / ${platformSettings.contentMaxLength}`}
                                            </p>
                                        </div>
                                    </div>
                                </MagicShadow>
                            </FormControl>
                        </FormItem>
                    )}
                />

                {platformSettings.name === 'Twitter' && (
                    <div className="w-full px-4 text-right text-xs text-muted-foreground">
                        {`${Math.floor(
                            (platformSettings.contentMaxLength -
                                characterCount) /
                                280,
                        )} tweets`}
                    </div>
                )}

                {errors.content && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {errors.content.message}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <div className="mt-auto flex justify-end">
                <Button onClick={onNext} disabled={!content || isOverLimit}>
                    Continue to Media
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
