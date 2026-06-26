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
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useEffect, useTransition } from 'react';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-provider';
import { userDetails } from '@/actions/settings';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { AvatarEditor } from './avatar-editor';
import { userDetailsSchema } from '@/lib/validations/user';
import { cn } from '@/lib/utils';
import { rawTimeZones } from '@vvo/tzdb';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { convertTimezoneOffset } from '@/lib/timezone';

type FormData = z.infer<typeof userDetailsSchema>;

const timeZones = rawTimeZones.map((tz) => ({
    label: `(${convertTimezoneOffset(tz.rawOffsetInMinutes)}) ${tz.name}`,
    value: tz.name,
}));

export default function GeneralSettingsForm({
    className,
    ...props
}: React.HTMLAttributes<HTMLFormElement>) {
    const user = useCurrentUser();

    const [disabledButton, setDisabledButton] = useState(true);
    const { refetch } = useAuth();
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormData>({
        resolver: zodResolver(userDetailsSchema),
        defaultValues: {
            name: user?.name || '',
            timeZone: user?.timeZone,
            isTwoFactorEnabled: user?.isTwoFactorEnabled || false,
        },
        mode: 'onChange',
    });

    const { isDirty, isValid } = form.formState;

    useEffect(() => {
        const disabled = !isDirty || !isValid;
        setDisabledButton(disabled);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.formState]);

    async function onSubmit(values: FormData) {
        startTransition(() => {
            userDetails(values)
                .then((data) => {
                    if (data.error) {
                        toast({
                            title: data.error,
                            description:
                                'User details was not updated. Please try again.',
                            variant: 'destructive',
                        });
                    }

                    if (data.success) {
                        void refetch();

                        form.reset(values, {
                            keepDirty: false,
                            keepIsValid: false,
                        });

                        toast({
                            description: 'User details has been updated.',
                        });
                    }
                })
                .catch(() =>
                    toast({
                        title: 'Something went wrong.',
                        description:
                            'User details was not updated. Please try again.',
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
                                User Profile
                            </h2>
                            <div className="space-y-4">
                                <AvatarEditor
                                    value={user?.image || ''}
                                    name={user?.name || ''}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="John Doe"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            value={user?.email || ''}
                                            disabled
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>

                                <FormField
                                    control={form.control}
                                    name="timeZone"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Time Zone</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                'w-full justify-between',
                                                                !field.value &&
                                                                    'text-muted-foreground',
                                                            )}
                                                        >
                                                            {field.value
                                                                ? timeZones.find(
                                                                      (tz) =>
                                                                          tz.value ===
                                                                          field.value,
                                                                  )?.label
                                                                : 'Select time zone'}
                                                            <ChevronsUpDown className="opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-full max-w-[350px] p-0"
                                                    align="start"
                                                >
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search time zone..."
                                                            className="h-9"
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No time zone
                                                                found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {timeZones.map(
                                                                    (tz) => (
                                                                        <CommandItem
                                                                            value={
                                                                                tz.label
                                                                            }
                                                                            key={
                                                                                tz.value
                                                                            }
                                                                            onSelect={() => {
                                                                                form.setValue(
                                                                                    'timeZone',
                                                                                    tz.value,
                                                                                    {
                                                                                        shouldValidate:
                                                                                            true,
                                                                                        shouldDirty:
                                                                                            true,
                                                                                    },
                                                                                );
                                                                            }}
                                                                        >
                                                                            {
                                                                                tz.label
                                                                            }
                                                                            <Check
                                                                                className={cn(
                                                                                    'ml-auto',
                                                                                    tz.value ===
                                                                                        field.value
                                                                                        ? 'opacity-100'
                                                                                        : 'opacity-0',
                                                                                )}
                                                                            />
                                                                        </CommandItem>
                                                                    ),
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                This is the time zone that will
                                                be used by the system.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {user?.isOAuth === false && (
                                    <FormField
                                        control={form.control}
                                        name="isTwoFactorEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <FormLabel>
                                                        Two-Factor
                                                        Authentication
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Receive a code on your
                                                        phone to verify your
                                                        identity when logging
                                                        in.
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
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={disabledButton || isPending}
                        >
                            {isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
