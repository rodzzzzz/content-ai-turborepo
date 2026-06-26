'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const notificationSettingsSchema = z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
});

export default function NotificationSettingsForm() {
    const form = useForm<z.infer<typeof notificationSettingsSchema>>({
        resolver: zodResolver(notificationSettingsSchema),
        defaultValues: {
            emailNotifications: true,
            pushNotifications: true,
        },
    });

    function onSubmit(values: z.infer<typeof notificationSettingsSchema>) {
        toast({
            title: 'Settings updated',
            description:
                'Your general settings have been successfully updated.',
        });
        console.log(values);
    }

    return (
        <Card className="border-0 lg:border">
            <CardContent className="p-0 lg:p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="mb-4 text-xl font-semibold">
                                Notifications
                            </h2>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="emailNotifications"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Email Notifications
                                                </FormLabel>
                                                <FormDescription>
                                                    Receive email notifications
                                                    about your account and AI
                                                    agent activities.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pushNotifications"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">
                                                    Push Notifications
                                                </FormLabel>
                                                <FormDescription>
                                                    Receive push notifications
                                                    on your devices about
                                                    important updates.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Button type="submit">Save Changes</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
