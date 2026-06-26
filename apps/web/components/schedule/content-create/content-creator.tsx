'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StepIndicator } from './step-indicator';
import { PlatformSelector } from './platform-selector';
import { ContentTab } from './content-tab';
import { MediaTab } from './media-tab';
import { PublishTab } from './publish-tab';
import { Platform, Schedule } from '@prisma/client';
import {
    useCreateSchedule,
    useUpdateSchedule,
} from '@/hooks/use-schedule-mutations';

interface ContentCreatorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dateFromCalendar?: Date;
    postToEdit?: Schedule | null;
    setPostToEdit: Dispatch<SetStateAction<Schedule | null>>;
    mediaSuggestion?: string;
    imagePrompt?: string;
}

// Define the platforms and their specific validation schemas
const platforms = {
    FACEBOOK: {
        name: 'Facebook',
        contentMaxLength: 63206,
        mediaMaxCount: 10,
        schema: z.object({
            content: z.string().max(63206, {
                message: 'Facebook posts cannot exceed 63,206 characters',
            }),
            mediaUrl: z.array(z.string()).max(10, {
                message: 'Facebook allows a maximum of 10 media items',
            }),
        }),
    },
    LINKEDIN: {
        name: 'LinkedIn',
        contentMaxLength: 3000,
        mediaMaxCount: 9,
        schema: z.object({
            content: z.string().max(3000, {
                message: 'LinkedIn posts cannot exceed 3,000 characters',
            }),
            mediaUrl: z.array(z.string()).max(9, {
                message: 'LinkedIn allows a maximum of 9 media items',
            }),
        }),
    },
};

// Base schema that will be extended with platform-specific validation
const baseSchema = z.object({
    platform: z.enum(['FACEBOOK', 'LINKEDIN'] as const).optional(),
    content: z.string(),
    date: z.date().optional(),
    mediaUrl: z.array(z.string()),
});

export type ContentFormValues = z.infer<typeof baseSchema>;

export function ContentCreator({
    open,
    onOpenChange,
    dateFromCalendar,
    postToEdit,
    setPostToEdit,
    mediaSuggestion,
    imagePrompt,
}: ContentCreatorProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
        null,
    );
    const [currentStep, setCurrentStep] = useState<
        'platform' | 'content' | 'media' | 'publish'
    >('platform');
    const { toast } = useToast();
    const createScheduleMutation = useCreateSchedule();
    const updateScheduleMutation = useUpdateSchedule();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Create a dynamic schema based on the selected platform
    const getValidationSchema = () => {
        if (
            !selectedPlatform ||
            !platforms[selectedPlatform as keyof typeof platforms]
        ) {
            return baseSchema;
        }

        const platformSchema =
            platforms[selectedPlatform as keyof typeof platforms].schema;

        return baseSchema.merge(platformSchema);
    };

    const form = useForm<ContentFormValues>({
        resolver: zodResolver(getValidationSchema()),
        defaultValues: {
            platform: undefined,
            content: '',
            mediaUrl: [],
            date: dateFromCalendar,
        },
        mode: 'onChange',
    });

    const { setValue, watch, formState, reset } = form;
    const watchedValues = watch();

    // Initialize form with post data when editing
    useEffect(() => {
        if (postToEdit) {
            // Skip Twitter posts as they are now handled manually
            if (postToEdit.platform === 'TWITTER') {
                return;
            }

            // Set the platform first
            setSelectedPlatform(postToEdit.platform);
            setValue('platform', postToEdit.platform);

            // Then set the rest of the values
            setValue('content', postToEdit.content);
            setValue('mediaUrl', postToEdit.mediaUrl);
            setValue('date', new Date(postToEdit.date));

            // Start at the content step when editing
            setCurrentStep('content');
        }
    }, [postToEdit, setValue]);

    useEffect(() => {
        if (!open) {
            reset();
            setPostToEdit(null);
            if (!postToEdit) {
                setSelectedPlatform(null);
                setCurrentStep('platform');
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, reset, postToEdit]);

    // Update the form when platform changes
    const handlePlatformSelect = (platform: string) => {
        setSelectedPlatform(platform);
        setValue('platform', platform as 'FACEBOOK' | 'LINKEDIN');
        setCurrentStep('content');
    };

    // Navigate between steps
    const goToStep = (step: 'platform' | 'content' | 'media' | 'publish') => {
        setCurrentStep(step);
    };

    const onSubmit = async (
        values: ContentFormValues,
        status: 'DRAFT' | 'SCHEDULED',
    ) => {
        // Validate that date is provided for scheduling
        if (status === 'SCHEDULED' && !values.date) {
            toast({
                title: 'Date required',
                description:
                    'Please select a date and time to schedule your post.',
                variant: 'destructive',
            });
            return;
        }

        const isEditing = !!postToEdit;
        const toastTitle = isEditing
            ? 'Content updated successfully'
            : status === 'SCHEDULED'
              ? 'Content scheduled successfully'
              : 'Content saved successfully';

        const toastDescription = isEditing
            ? 'Your content has been updated'
            : status === 'SCHEDULED'
              ? 'Your content has been scheduled and will be published at the selected date and time'
              : 'Your content has been saved and is ready to publish';

        try {
            setIsSubmitting(true);

            if (isEditing) {
                // Update existing schedule
                await updateScheduleMutation.mutateAsync({
                    id: postToEdit.id,
                    data: {
                        platform: values.platform as Platform,
                        content: values.content,
                        mediaUrl: values.mediaUrl,
                        date: values.date as Date,
                        status,
                    },
                });
            } else {
                // Create new schedule
                await createScheduleMutation.mutateAsync({
                    platform: values.platform as Platform,
                    content: values.content,
                    mediaUrl: values.mediaUrl,
                    date: values.date as Date,
                    status,
                });
            }

            onOpenChange(false);

            toast({
                title: toastTitle,
                description: toastDescription,
            });

            reset();
            setSelectedPlatform(null);
            setCurrentStep('platform');
            setIsSubmitting(false);
        } catch (error) {
            let errorMessage = 'There was a problem scheduling your content.';

            if (error instanceof Error) {
                errorMessage = error.message;

                // Handle specific error cases
                if (errorMessage.includes('past')) {
                    toast({
                        title: 'Cannot schedule post',
                        description: 'Date is in the past.',
                        variant: 'destructive',
                    });
                    return;
                }
            }

            toast({
                title: 'Something went wrong',
                description: errorMessage,
                variant: 'destructive',
            });

            setIsSubmitting(false);
        }
    };

    const onPostNow = async (values: ContentFormValues) => {
        const toastTitle = 'Content posted successfully';
        const toastDescription =
            'Your content has been posted immediately to the platform';

        try {
            setIsSubmitting(true);

            const response = await fetch('/api/schedule/post-now', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to post content');
            }

            const data = (await response.json()) as Schedule;

            // Create new schedule with status PUBLISHED
            await createScheduleMutation.mutateAsync({
                id: data.id,
                platform: data.platform as Platform,
                content: data.content,
                mediaUrl: data.mediaUrl,
                date: data.date as Date,
                status: 'PUBLISHED',
            });

            onOpenChange(false);

            toast({
                title: toastTitle,
                description: toastDescription,
            });

            reset();
            setSelectedPlatform(null);
            setCurrentStep('platform');
            setIsSubmitting(false);
        } catch (error) {
            let errorMessage = 'There was a problem posting your content.';

            if (error instanceof Error) {
                errorMessage = error.message;
            }

            toast({
                title: 'Something went wrong',
                description: errorMessage,
                variant: 'destructive',
            });

            setIsSubmitting(false);
        }
    };

    // Get platform-specific settings
    const getPlatformSettings = () => {
        if (!selectedPlatform) return null;
        return platforms[selectedPlatform as keyof typeof platforms];
    };

    const platformSettings = getPlatformSettings();

    return (
        <FormProvider {...form}>
            <div className="flex h-full flex-col gap-6 lg:p-6">
                <StepIndicator
                    currentStep={currentStep}
                    onStepClick={goToStep}
                    isStepValid={{
                        platform: !!selectedPlatform,
                        content: !!watchedValues.content,
                        media: true, // Media is optional for some platforms
                        publish: formState.isValid,
                    }}
                />

                <Tabs value={currentStep} className="h-full">
                    <TabsContent value="platform" className="mt-0 h-full">
                        <PlatformSelector
                            onSelect={handlePlatformSelect}
                            selectedPlatform={selectedPlatform}
                        />
                    </TabsContent>

                    <TabsContent value="content" className="mt-0 h-full">
                        {platformSettings && (
                            <ContentTab
                                platformSettings={platformSettings}
                                onNext={() => goToStep('media')}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="media" className="mt-0 h-full">
                        {platformSettings && (
                            <MediaTab
                                platformSettings={platformSettings}
                                onNext={() => goToStep('publish')}
                                onBack={() => goToStep('content')}
                                mediaSuggestion={mediaSuggestion}
                                imagePrompt={imagePrompt}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="publish" className="mt-0 h-full">
                        {platformSettings && (
                            <PublishTab
                                platformSettings={platformSettings}
                                onBack={() => goToStep('media')}
                                onSaveDraft={() =>
                                    onSubmit(watchedValues, 'DRAFT')
                                }
                                onPublish={() =>
                                    onSubmit(watchedValues, 'SCHEDULED')
                                }
                                onPostNow={() => onPostNow(watchedValues)}
                                isSubmitting={isSubmitting}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </FormProvider>
    );
}
