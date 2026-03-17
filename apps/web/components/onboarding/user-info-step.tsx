'use client';

import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { onboardingSchema } from '@/lib/validations/onboarding';
import { z } from 'zod';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rawTimeZones } from '@vvo/tzdb';
import { convertTimezoneOffset } from '@/lib/timezone';

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface UserInfoStepProps {
    control: Control<OnboardingFormData>;
}

const timeZones = rawTimeZones.map((tz) => ({
    label: `(${convertTimezoneOffset(tz.rawOffsetInMinutes)}) ${tz.name}`,
    value: tz.name,
}));

export function UserInfoStep({ control }: UserInfoStepProps) {
    return (
        <div className="flex-1 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                    Personal Information
                </h2>
                <p className="mt-2 text-muted-foreground">
                    Let&apos;s start with your name
                </p>
            </div>

            <div className="mt-8 space-y-5">
                <FormField
                    control={control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                First Name{' '}
                                <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    id="firstName"
                                    placeholder="Enter your first name"
                                    {...field}
                                    className="h-12"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Last Name{' '}
                                <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    id="lastName"
                                    placeholder="Enter your last name"
                                    {...field}
                                    className="h-12"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="timeZone"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>
                                Time Zone{' '}
                                <span className="text-red-500">*</span>
                            </FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                'h-12 w-full justify-between',
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
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                                                No time zone found.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {timeZones.map((tz) => (
                                                    <CommandItem
                                                        value={tz.label}
                                                        key={tz.value}
                                                        onSelect={() => {
                                                            field.onChange(
                                                                tz.value,
                                                            );
                                                        }}
                                                    >
                                                        {tz.label}
                                                        <Check
                                                            className={cn(
                                                                'ml-auto h-4 w-4',
                                                                tz.value ===
                                                                    field.value
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0',
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
