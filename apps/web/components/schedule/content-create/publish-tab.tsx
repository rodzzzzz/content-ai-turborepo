'use client';

import { useFormContext } from 'react-hook-form';
import type { ContentFormValues } from './content-creator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    FormDescription,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import {
    ArrowLeft,
    Clock,
    CalendarIcon,
    SaveIcon,
    Loader2,
    CalendarArrowUp,
    SendHorizonalIcon,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateTimePicker } from './date-time-picker';
import { FormControl } from '@/components/ui/form';
import { getOffsetFromTimezone } from '@/lib/timezone';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';

interface PublishTabProps {
    platformSettings: {
        name: string;
        contentMaxLength: number;
        mediaMaxCount: number;
    };
    onBack: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
    onPostNow: () => void;
    isSubmitting: boolean;
}

export function PublishTab({
    platformSettings,
    onBack,
    onSaveDraft,
    onPublish,
    onPostNow,
    isSubmitting,
}: PublishTabProps) {
    const user = useCurrentUser();
    const timezone = user?.timeZone;
    const { control, watch } = useFormContext<ContentFormValues>();
    const { content, mediaUrl, date } = watch();

    const [processing, setProcessing] = useState<
        'DRAFT' | 'SCHEDULED' | 'POST_NOW' | null
    >(null);

    useEffect(() => {
        if (!isSubmitting) {
            setProcessing(null);
        }
    }, [isSubmitting]);

    const getLoadingMessage = () => {
        switch (processing) {
            case 'DRAFT':
                return 'Saving as draft...';
            case 'SCHEDULED':
                return 'Scheduling your post...';
            case 'POST_NOW':
                return 'Publishing your post...';
            default:
                return null;
        }
    };

    const getLoadingDescription = () => {
        switch (processing) {
            case 'DRAFT':
                return 'Your content is being saved and will be available for editing later.';
            case 'SCHEDULED':
                return 'Your post is being scheduled and will be published at the selected time.';
            case 'POST_NOW':
                return 'Your post is being published.';
            default:
                return 'Please wait while we process your request...';
        }
    };

    return (
        <div className="flex h-full flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold">Publish Your Content</h2>
                <p className="mt-1 text-muted-foreground">
                    Review and publish your {platformSettings.name} post
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium">Platform</h3>
                            <p className="text-sm">{platformSettings.name}</p>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-sm font-medium">
                                Content Length
                            </h3>
                            <p className="text-sm">
                                {`${content.length} of ${platformSettings.contentMaxLength} characters`}
                            </p>
                        </div>

                        <Separator />

                        <div>
                            <h3 className="text-sm font-medium">Media</h3>
                            <p className="text-sm">
                                {`${mediaUrl.length} of ${platformSettings.mediaMaxCount} items`}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Schedule Date and Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <FormField
                            control={control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <Popover modal>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-full px-4 text-left font-normal',
                                                        !field.value &&
                                                            'text-muted-foreground',
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            'PPP hh:mm a',
                                                        )
                                                    ) : (
                                                        <span>
                                                            Pick a date and time
                                                        </span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <DateTimePicker
                                                value={field.value}
                                                onChange={(d) =>
                                                    field.onChange(d)
                                                }
                                                disabledPast
                                                timezone={timezone}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription className="inline-flex gap-1">
                                        {`(${getOffsetFromTimezone(timezone!)}) ${timezone}.`}
                                        <Link
                                            href="/settings/general"
                                            className="text-primary underline"
                                        >
                                            Change timezone
                                        </Link>
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* Schedule Date and Time Display */}
                        <Card className="bg-muted">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-5 w-5 flex-shrink-0" />

                                    {date ? (
                                        <p>
                                            {`Scheduled for ${format(date, 'PPP hh:mm a')} ${timezone}`}
                                        </p>
                                    ) : (
                                        <p>
                                            Select a date and time to schedule
                                            your post, or use &quot;Post
                                            Now&quot; to publish immediately
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </div>

            {/* Loading Status Indicator */}
            {isSubmitting && processing && (
                <div className="animate-pulse rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/20"></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">
                                {getLoadingMessage()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {getLoadingDescription()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-auto flex flex-wrap gap-x-2 gap-y-4">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                </Button>
                <Button
                    className="ml-auto"
                    variant="outline"
                    onClick={() => {
                        setProcessing('DRAFT');
                        onSaveDraft();
                    }}
                    disabled={isSubmitting || !date}
                >
                    {isSubmitting && processing === 'DRAFT' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <SaveIcon className="h-4 w-4" />
                    )}
                    {isSubmitting && processing === 'DRAFT'
                        ? 'Saving...'
                        : 'Save as Draft'}
                </Button>
                <Button
                    onClick={() => {
                        setProcessing('SCHEDULED');
                        onPublish();
                    }}
                    disabled={isSubmitting || !date}
                    className="w-full sm:w-auto"
                    variant="outline"
                >
                    {isSubmitting && processing === 'SCHEDULED' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CalendarArrowUp className="h-4 w-4" />
                    )}
                    {isSubmitting && processing === 'SCHEDULED'
                        ? 'Scheduling...'
                        : 'Schedule'}
                </Button>
                <Button
                    onClick={() => {
                        setProcessing('POST_NOW');
                        onPostNow();
                    }}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                    variant="default"
                >
                    {isSubmitting && processing === 'POST_NOW' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <SendHorizonalIcon className="h-4 w-4" />
                    )}
                    {isSubmitting && processing === 'POST_NOW'
                        ? 'Publishing...'
                        : 'Post Now'}
                </Button>
            </div>
        </div>
    );
}
