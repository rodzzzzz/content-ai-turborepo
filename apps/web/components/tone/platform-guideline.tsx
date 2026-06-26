'use client';

import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import {
    PlatformGuidelinesFormValues,
    platformGuidelinesSchema,
} from '@/lib/validations/personality';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    Form,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { usePersonality } from '@/hooks/use-personality-query';
import { useUpdatePlatformGuidelines } from '@/hooks/use-personality-mutations';
import { useEffect } from 'react';
import { Loader2, RotateCcwIcon, SaveIcon } from 'lucide-react';
import { DEFAULT_PLATFORM_GUIDELINES } from '@/constants/prompt';

export default function PlatformGuidelines() {
    const { data: writingStyle, isLoading: isFetching } = usePersonality();
    const { mutate: updatePlatformGuidelines, isPending: isUpdating } =
        useUpdatePlatformGuidelines();

    const form = useForm<PlatformGuidelinesFormValues>({
        resolver: zodResolver(platformGuidelinesSchema),
        defaultValues: {
            twitter:
                writingStyle?.twitter ?? DEFAULT_PLATFORM_GUIDELINES.twitter,
            linkedin:
                writingStyle?.linkedin ?? DEFAULT_PLATFORM_GUIDELINES.linkedin,
            facebook:
                writingStyle?.facebook ?? DEFAULT_PLATFORM_GUIDELINES.facebook,
        },
    });

    useEffect(() => {
        if (writingStyle) {
            form.reset({
                twitter:
                    writingStyle.twitter ?? DEFAULT_PLATFORM_GUIDELINES.twitter,
                linkedin:
                    writingStyle.linkedin ??
                    DEFAULT_PLATFORM_GUIDELINES.linkedin,
                facebook:
                    writingStyle.facebook ??
                    DEFAULT_PLATFORM_GUIDELINES.facebook,
            });
        }
    }, [writingStyle, form]);

    const onSubmit = (data: PlatformGuidelinesFormValues) => {
        updatePlatformGuidelines(data);
        form.reset(data);
    };

    const handleRestoreDefault = (
        platform: 'twitter' | 'linkedin' | 'facebook',
    ) => {
        let resetValue = {};

        switch (platform) {
            case 'twitter':
                resetValue = { twitter: DEFAULT_PLATFORM_GUIDELINES.twitter };
                break;
            case 'linkedin':
                resetValue = { linkedin: DEFAULT_PLATFORM_GUIDELINES.linkedin };
                break;
            case 'facebook':
                resetValue = { facebook: DEFAULT_PLATFORM_GUIDELINES.facebook };
                break;
            default:
                break;
        }

        form.reset(resetValue);
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
                                name="twitter"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
                                            X
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                type="button"
                                                onClick={() =>
                                                    handleRestoreDefault(
                                                        'twitter',
                                                    )
                                                }
                                                disabled={
                                                    isUpdating ||
                                                    field.value ===
                                                        DEFAULT_PLATFORM_GUIDELINES.twitter
                                                }
                                            >
                                                <RotateCcwIcon className="h-4 w-4" />
                                                Restore Default
                                            </Button>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="Tell your content creator bot how to write X posts..."
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
                                name="linkedin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
                                            LinkedIn
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                type="button"
                                                onClick={() =>
                                                    handleRestoreDefault(
                                                        'linkedin',
                                                    )
                                                }
                                                disabled={
                                                    isUpdating ||
                                                    field.value ===
                                                        DEFAULT_PLATFORM_GUIDELINES.linkedin
                                                }
                                            >
                                                <RotateCcwIcon className="h-4 w-4" />
                                                Restore Default
                                            </Button>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="Tell your content creator bot how to write LinkedIn posts..."
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
                                name="facebook"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
                                            Facebook
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                type="button"
                                                onClick={() =>
                                                    handleRestoreDefault(
                                                        'facebook',
                                                    )
                                                }
                                                disabled={
                                                    isUpdating ||
                                                    field.value ===
                                                        DEFAULT_PLATFORM_GUIDELINES.facebook
                                                }
                                            >
                                                <RotateCcwIcon className="h-4 w-4" />
                                                Restore Default
                                            </Button>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="Tell your content creator bot how to write Facebook posts..."
                                                className="min-h-[200px]"
                                                disabled={isUpdating}
                                            />
                                        </FormControl>
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
            </CardContent>
        </Card>
    );
}

const WritingStyleSkeleton = () => {
    return (
        <Card className="border-0 lg:border">
            <CardContent className="p-0 lg:p-6">
                <div className="flex flex-col gap-6">
                    {/* X Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-8 animate-pulse rounded-md bg-muted" />
                            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
                        </div>
                        <div className="h-[200px] animate-pulse rounded-md bg-muted" />
                    </div>

                    {/* LinkedIn Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
                            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
                        </div>
                        <div className="h-[200px] animate-pulse rounded-md bg-muted" />
                    </div>

                    {/* Facebook Field */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-20 animate-pulse rounded-md bg-muted" />
                            <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
                        </div>
                        <div className="h-[200px] animate-pulse rounded-md bg-muted" />
                    </div>

                    {/* Save Button */}
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                </div>
            </CardContent>
        </Card>
    );
};
