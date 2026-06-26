'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isAfter } from 'date-fns';
import { Platform, Schedule } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreateSchedule } from '@/hooks/use-schedule-mutations';
import { Button } from '@/components/ui/button';
import {
    FormField,
    FormItem,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { FormControl } from '@/components/ui/form';
import { DateTimePicker } from '@/components/schedule/content-create/date-time-picker';
import { cn } from '@/lib/utils';
import { getOffsetFromTimezone } from '@/lib/timezone';
import {
    CalendarIcon,
    Loader2,
    CalendarArrowUp,
    SendHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useCampaignPreview } from '@/contexts/campaign-preview-context';
import { ContentItem } from '@/types/campaign';

// Validation schema for scheduling
const scheduleSchema = z.object({
    date: z.date({
        error: 'Date and time are required',
    }),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface SchedulePostPopoverProps {
    children: React.ReactNode;
    content: ContentItem;
    setContent: Dispatch<SetStateAction<ContentItem | null>>;
}

export function SchedulePostPopover({
    children,
    content,
    setContent,
}: SchedulePostPopoverProps) {
    const user = useCurrentUser();
    const { toast } = useToast();
    const createScheduleMutation = useCreateSchedule();
    const [isScheduling, setIsScheduling] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [open, setOpen] = useState(false);

    const { updateContent } = useCampaignPreview();

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            date: new Date(content.dateAndTime),
        },
    });

    const { control, watch, handleSubmit, reset } = form;
    const watchedValues = watch();
    const { date: dateValue } = watchedValues;

    const isDateValid = dateValue && isAfter(dateValue, new Date());

    useEffect(() => {
        form.reset();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const onSubmit = async (values: ScheduleFormValues) => {
        try {
            setIsScheduling(true);

            Promise.all([
                createScheduleMutation.mutateAsync({
                    platform: content.platform.toUpperCase() as Platform,
                    content: content.content,
                    mediaUrl: content.media || [],
                    date: values.date,
                    status: 'SCHEDULED',
                }),
                handleUpdateContent(),
            ]);

            toast({
                title: 'Post Scheduled Successfully',
                description: `Your post has been scheduled for ${format(
                    values.date,
                    'PPP hh:mm a',
                )} ${user?.timeZone}`,
            });

            setOpen(false);
            reset();
        } catch (error) {
            console.error('Schedule error:', error);
            toast({
                title: 'Failed to Schedule Post',
                description:
                    'There was an error scheduling your post. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsScheduling(false);
        }
    };

    const handlePostNow = async () => {
        try {
            setIsPublishing(true);

            const response = await fetch('/api/schedule/post-now', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    platform: content.platform.toUpperCase() as Platform,
                    content: content.content,
                    mediaUrl: content.media || [],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to post content');
            }

            const data = (await response.json()) as Schedule;

            Promise.all([
                createScheduleMutation.mutateAsync({
                    id: data.id,
                    platform: data.platform as Platform,
                    content: data.content,
                    mediaUrl: data.mediaUrl,
                    date: data.date as Date,
                    status: 'PUBLISHED',
                }),
                handleUpdateContent(),
            ]);

            toast({
                title: 'Post Published Successfully',
                description: `Your post has been published to the platform.`,
            });

            setOpen(false);
            reset();
        } catch (error) {
            console.error('Publish error:', error);
            toast({
                title: 'Failed to Publish Post',
                description:
                    'There was an error publishing your post. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleUpdateContent = async () => {
        await updateContent(content.id, {
            ...content,
            status: 'scheduled',
        });

        setContent((prev) => ({
            ...prev!,
            status: 'scheduled',
        }));
    };

    if (!user) {
        return null;
    }

    return (
        <Popover
            open={open}
            onOpenChange={(newOpen) => {
                if (!isScheduling && !isPublishing) {
                    setOpen(newOpen);
                }
            }}
        >
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <FormProvider {...form}>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Schedule Date and Time */}
                        <div className="space-y-3">
                            <div>
                                <h3 className="text-sm font-medium">
                                    Schedule Date and Time
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Choose when to publish your post
                                </p>
                            </div>

                            <FormField
                                control={control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem>
                                        <Popover modal>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full px-3 text-left font-normal',
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
                                                                Pick a date and
                                                                time
                                                            </span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="end"
                                            >
                                                <DateTimePicker
                                                    value={field.value}
                                                    onChange={(d) =>
                                                        field.onChange(d)
                                                    }
                                                    disabledPast
                                                    timezone={user?.timeZone}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription className="text-xs">
                                            {`(${getOffsetFromTimezone(user.timeZone)} ${user.timeZone})`}
                                            <Link
                                                href="/settings/general"
                                                className="ml-1 text-primary underline"
                                            >
                                                Change
                                            </Link>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handlePostNow}
                                disabled={isPublishing || isScheduling}
                            >
                                {isPublishing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <SendHorizontal className="h-4 w-4" />
                                        Publish Now
                                    </>
                                )}
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="w-full"
                                disabled={
                                    isScheduling ||
                                    isPublishing ||
                                    !dateValue ||
                                    !isDateValid
                                }
                            >
                                {isScheduling ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <CalendarArrowUp className="h-4 w-4" />
                                        Schedule
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </PopoverContent>
        </Popover>
    );
}
