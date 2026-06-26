'use client';

import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import {
    PersonalityFormValues,
    personalitySchema,
} from '@/lib/validations/personality';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
    Form,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { usePersonality } from '@/hooks/use-personality-query';
import {
    useUpdateWritingStyle,
    useExtractPersonality,
} from '@/hooks/use-personality-mutations';
import { useEffect, useState } from 'react';
import PersonalityExtractionDialog from './personality-extraction-dialog';
import {
    GlobeIcon,
    InfoIcon,
    Loader2,
    RotateCcwIcon,
    SaveIcon,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import {
    DEFAULT_EMOJI,
    DEFAULT_PERSONALITY,
    DEFAULT_TEMPERATURE,
    DEFAULT_WRITING_STYLE,
} from '@/constants/prompt';

export default function WritingStyle() {
    const { data: writingStyle, isLoading: isFetching } = usePersonality();
    const { mutate: updateWritingStyle, isPending: isUpdating } =
        useUpdateWritingStyle();
    const {
        mutateAsync: extractPersonality,
        isPending: isExtractingPersonality,
    } = useExtractPersonality();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<PersonalityFormValues>({
        resolver: zodResolver(personalitySchema),
        defaultValues: {
            personality: writingStyle?.personality ?? DEFAULT_PERSONALITY,
            writingStyle: writingStyle?.writingStyle ?? DEFAULT_WRITING_STYLE,
            additionalInstructions: writingStyle?.additionalInstructions ?? '',
            temperature: writingStyle?.temperature ?? DEFAULT_TEMPERATURE,
            emoji: writingStyle?.emoji ?? DEFAULT_EMOJI,
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (writingStyle) {
            form.reset({
                personality: writingStyle.personality ?? DEFAULT_PERSONALITY,
                writingStyle:
                    writingStyle.writingStyle ?? DEFAULT_WRITING_STYLE,
                additionalInstructions:
                    writingStyle.additionalInstructions ?? '',
                temperature: writingStyle.temperature ?? DEFAULT_TEMPERATURE,
                emoji: writingStyle.emoji ?? DEFAULT_EMOJI,
            });
        }
    }, [writingStyle, form]);

    const onSubmit = (data: PersonalityFormValues) => {
        updateWritingStyle(data);
        form.reset(data);
    };

    const handleRestoreDefault = (field: 'personality' | 'writingStyle') => {
        switch (field) {
            case 'personality':
                form.setValue('personality', DEFAULT_PERSONALITY, {
                    shouldDirty: true,
                });
                break;
            case 'writingStyle':
                form.setValue('writingStyle', DEFAULT_WRITING_STYLE, {
                    shouldDirty: true,
                });
                break;
            default:
                break;
        }
    };

    const handleExtractPersonality = async (url: string) => {
        try {
            const result = await extractPersonality(url);
            if (result.success && result.data) {
                // Update the form field
                form.setValue('personality', result.data, {
                    shouldDirty: true,
                });

                // Save to database immediately with current form values
                const currentValues = form.getValues();
                updateWritingStyle({
                    ...currentValues,
                    personality: result.data,
                });

                setIsDialogOpen(false);
            }
        } catch (error) {
            console.error('[EXTRACT_PERSONALITY_ERROR]', error);
            // Error is handled by the mutation hook
        }
    };

    const isDirty = form.formState.isDirty;
    const isValid = form.formState.isValid;

    if (isFetching) {
        return <WritingStyleSkeleton />;
    }

    return (
        <Card className="border-0 lg:border">
            <CardContent className="p-0 lg:p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div className="flex flex-col gap-6">
                            <FormField
                                control={form.control}
                                name="personality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
                                            Personality
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    type="button"
                                                    onClick={() =>
                                                        handleRestoreDefault(
                                                            'personality',
                                                        )
                                                    }
                                                    disabled={
                                                        isUpdating ||
                                                        field.value ===
                                                            DEFAULT_PERSONALITY
                                                    }
                                                >
                                                    <RotateCcwIcon className="h-4 w-4" />
                                                    Restore Default
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    type="button"
                                                    onClick={() =>
                                                        setIsDialogOpen(true)
                                                    }
                                                    disabled={
                                                        isUpdating ||
                                                        isExtractingPersonality
                                                    }
                                                >
                                                    {isExtractingPersonality ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Extracting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <GlobeIcon className="h-4 w-4" />{' '}
                                                            Get From Website
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Give your content creator bot a personality..."
                                                className="min-h-[250px]"
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            A good prompt will allow the bot to
                                            create content that is more
                                            personalized and relevant to your
                                            brand.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="writingStyle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
                                            Writing Style
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                type="button"
                                                onClick={() =>
                                                    handleRestoreDefault(
                                                        'writingStyle',
                                                    )
                                                }
                                                disabled={
                                                    isUpdating ||
                                                    field.value ===
                                                        DEFAULT_WRITING_STYLE
                                                }
                                            >
                                                <RotateCcwIcon className="h-4 w-4" />
                                                Restore Default
                                            </Button>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Give your content creator bot instructions how to write your contents..."
                                                className="min-h-[250px]"
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            A good prompt will allow the bot to
                                            create content that matches your
                                            writing style.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="additionalInstructions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mb-1.5 block text-sm font-medium">
                                            Additional Instructions
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="You can specify blacklisted words, target audience, etc."
                                                className="min-h-[200px]"
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="temperature"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="mb-2 flex max-w-md justify-between">
                                            <FormLabel className="flex items-center gap-1 text-sm font-medium">
                                                Temperature
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-[300px]">
                                                        Temperature is used to
                                                        control the randomness
                                                        of the bot&apos;s
                                                        output. A higher
                                                        temperature value
                                                        (closer to 100) results
                                                        in more creative and
                                                        diverse responses, while
                                                        a lower a lower value
                                                        (closer to 0) leads to
                                                        more predictable and
                                                        coherent output.
                                                    </TooltipContent>
                                                </Tooltip>
                                            </FormLabel>
                                            <span className="text-sm text-muted-foreground">
                                                {field.value}%
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Slider
                                                min={0}
                                                max={100}
                                                step={10}
                                                value={[field.value ?? 0]}
                                                onValueChange={(value) =>
                                                    field.onChange(value[0])
                                                }
                                                className="max-w-md"
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
                                        <div className="mt-1 flex max-w-md justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                Predictable
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Creative
                                            </span>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="emoji"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
                                        <FormLabel className="text-sm font-medium">
                                            Use Emojis
                                        </FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                disabled={isUpdating || !isDirty || !isValid}
                            >
                                {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <SaveIcon className="h-4 w-4" />
                                )}
                                Save Preferences
                            </Button>
                        </div>
                    </form>
                </Form>
                <PersonalityExtractionDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onExtract={handleExtractPersonality}
                    isExtracting={isExtractingPersonality}
                />
            </CardContent>
        </Card>
    );
}

const WritingStyleSkeleton = () => {
    return (
        <Card className="border-0 lg:border">
            <CardContent className="p-0 lg:p-6">
                <div className="flex flex-col gap-6">
                    {/* Personality Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
                            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
                        </div>
                        <div className="h-[250px] animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                    </div>

                    {/* Writing Style Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
                            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
                        </div>
                        <div className="h-[250px] animate-pulse rounded-md bg-muted" />
                        <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                    </div>

                    {/* Additional Instructions Field */}
                    <div className="space-y-2">
                        <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
                        <div className="h-[200px] animate-pulse rounded-md bg-muted" />
                    </div>

                    {/* Temperature Slider */}
                    <div className="max-w-md space-y-2">
                        <div className="flex justify-between">
                            <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
                            <div className="h-5 w-12 animate-pulse rounded-md bg-muted" />
                        </div>
                        <div className="h-5 w-full animate-pulse rounded-full bg-muted" />
                        <div className="flex justify-between">
                            <div className="h-4 w-14 animate-pulse rounded-md bg-muted" />
                            <div className="h-4 w-14 animate-pulse rounded-md bg-muted" />
                        </div>
                    </div>

                    {/* Emoji Toggle */}
                    <div className="flex items-center space-x-2">
                        <div className="h-6 w-10 animate-pulse rounded-full bg-muted" />
                        <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
                    </div>

                    {/* Save Button */}
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                </div>
            </CardContent>
        </Card>
    );
};
