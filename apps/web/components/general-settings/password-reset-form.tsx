'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';
import { userPasswordSchema } from '@/lib/validations/user';
import { cn } from '@/lib/utils';
import { useTransition } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import { userPassword } from '@/actions/settings';
import { Loader2 } from 'lucide-react';

type FormData = z.infer<typeof userPasswordSchema>;

export default function PasswordResetForm({
    className,
    ...props
}: React.HTMLAttributes<HTMLFormElement>) {
    const { refetch } = useAuth();
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormData>({
        resolver: zodResolver(userPasswordSchema),
        mode: 'onChange',
        defaultValues: {
            password: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    async function onSubmit(values: FormData) {
        startTransition(() => {
            userPassword(values)
                .then((data) => {
                    if (data.error) {
                        toast({
                            title: data.error,
                            description:
                                'Password was not updated. Please try again.',
                            variant: 'destructive',
                        });
                    }

                    if (data.success) {
                        void refetch();

                        toast({
                            description: 'Password has been updated.',
                        });
                    }
                })
                .catch(() =>
                    toast({
                        title: 'Something went wrong.',
                        description:
                            'Password was not updated. Please try again.',
                        variant: 'destructive',
                    }),
                );
        });
    }

    return (
        <Card className="border-0 lg:border">
            <CardContent className="p-0 lg:p-6">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className={cn('space-y-8', className)}
                        {...props}
                    >
                        <div>
                            <h2 className="mb-4 text-xl font-semibold">
                                Password Reset
                            </h2>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Current Password
                                            </FormLabel>
                                            <FormControl>
                                                <PasswordInput {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput {...field} />
                                            </FormControl>
                                            <PasswordStrengthIndicator
                                                password={field.value || ''}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmNewPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Confirm New Password
                                            </FormLabel>
                                            <FormControl>
                                                <PasswordInput {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending || !form.formState.isValid}
                        >
                            {isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Reset Password
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
