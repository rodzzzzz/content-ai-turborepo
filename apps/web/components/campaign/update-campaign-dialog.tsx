'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { toast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '../ui/form';
import { Loader2, SaveIcon } from 'lucide-react';
import { useCampaignChatStore } from '@/hooks/use-campaign-chat-store';
import { Textarea } from '../ui/textarea';

const campaignUpsertSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(80, 'Title is too long. Maximum is 80 characters'),
    description: z
        .string()
        .min(1, 'Description is required')
        .max(300, 'Description is too long. Maximum is 150 characters'),
});

interface UpdateCampaignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaign: {
        id: string;
        title: string;
        description: string;
    };
}

type FormData = z.infer<typeof campaignUpsertSchema>;

export function UpdateCampaignDialog({
    open,
    onOpenChange,
    campaign,
}: UpdateCampaignDialogProps) {
    const [disabledButton, setDisabledButton] = useState(true);
    const { updateCampaign, isUpdatingCampaign } = useCampaignChatStore();

    const form = useForm<FormData>({
        resolver: zodResolver(campaignUpsertSchema),
        defaultValues: {
            title: campaign.title || '',
            description: campaign.description || '',
        },
    });

    // Reset form with new values when chat changes
    useEffect(() => {
        if (open) {
            form.reset({
                title: campaign.title || '',
                description: campaign.description || '',
            });
        }
    }, [campaign, open, form]);

    const { isValid, isDirty } = form.formState;

    useEffect(() => {
        if (isValid && isDirty) {
            setDisabledButton(false);
        } else {
            setDisabledButton(true);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.formState]);

    async function onUpdateCampaign(values: FormData) {
        try {
            await updateCampaign({
                id: campaign.id,
                data: {
                    title: values.title,
                    description: values.description,
                },
            });
            form.reset();
            toast({
                title: 'Campaign Updated',
                description:
                    'Campaign title and description have been updated successfully',
            });
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating campaign:', error);
            toast({
                title: 'Error',
                description: 'Failed to update campaign',
                variant: 'destructive',
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Update Campaign</DialogTitle>
                    <DialogDescription>
                        Update the campaign title and description to help you
                        identify it later.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit(onUpdateCampaign)(e);
                        }}
                    >
                        <div className="space-y-4 py-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter campaign title"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Enter campaign description"
                                                className="min-h-[120px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="mt-6 sm:space-x-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isUpdatingCampaign}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={disabledButton || isUpdatingCampaign}
                            >
                                {isUpdatingCampaign ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <SaveIcon className="h-4 w-4" />
                                )}
                                {isUpdatingCampaign ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
