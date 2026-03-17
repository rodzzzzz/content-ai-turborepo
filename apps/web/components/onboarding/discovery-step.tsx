'use client';

import { Control, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { onboardingSchema } from '@/lib/validations/onboarding';
import { z } from 'zod';
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface DiscoveryStepProps {
    control: Control<OnboardingFormData>;
}

export function DiscoveryStep({ control }: DiscoveryStepProps) {
    const discoveryOptions = [
        { value: 'search', label: 'Search Engine (Google, Bing, etc.)' },
        { value: 'social', label: 'Social Media' },
        { value: 'friend', label: 'Friend or Colleague' },
        { value: 'blog', label: 'Blog or Publication' },
        { value: 'other', label: 'Other' },
    ];

    const discoveryMethod = useWatch({
        control,
        name: 'discoveryChannel',
    });

    return (
        <div className="flex-1 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                    How Did You Find Us?
                </h2>
                <p className="mt-2 text-muted-foreground">
                    We&apos;d love to know how you discovered our platform
                </p>
            </div>

            <FormField
                control={control}
                name="discoveryChannel"
                render={({ field }) => (
                    <FormItem className="mt-8 space-y-4">
                        <FormControl>
                            <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-1"
                            >
                                {discoveryOptions.map((option) => (
                                    <motion.div
                                        key={option.value}
                                        className=""
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <FormLabel
                                            htmlFor={option.value}
                                            className={cn(
                                                'flex cursor-pointer items-center space-x-3 rounded-md border border-muted-foreground/80 p-4 font-medium text-foreground/70 transition-all hover:border-muted-foreground hover:bg-muted/50',
                                                discoveryMethod ===
                                                option.value &&
                                                'bg-primary text-primary-foreground hover:bg-primary/90',
                                            )}
                                        >
                                            <RadioGroupItem
                                                value={option.value}
                                                id={option.value}
                                                className="sr-only"
                                            />
                                            {option.label}
                                        </FormLabel>
                                    </motion.div>
                                ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
