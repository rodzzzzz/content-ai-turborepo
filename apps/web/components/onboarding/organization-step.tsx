'use client';

import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { onboardingSchema } from '@/lib/validations/onboarding';
import { z } from 'zod';
import { FormMessage } from '@/components/ui/form';
import { FormControl } from '@/components/ui/form';
import { FormItem, FormLabel } from '@/components/ui/form';
import { FormField } from '@/components/ui/form';

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OrganizationStepProps {
    control: Control<OnboardingFormData>;
}

export function OrganizationStep({ control }: OrganizationStepProps) {
    return (
        <div className="flex-1 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                    Organization Details
                </h2>
                <p className="mt-2 text-muted-foreground">
                    Tell us about your organization
                </p>
            </div>

            <div className="mt-8 space-y-5">
                <FormField
                    control={control}
                    name="organizationName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Organization Name{' '}
                                <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Input
                                    id="organizationName"
                                    placeholder="Enter your organization name"
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
                    name="organizationSize"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Organization Size{' '}
                                <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select organization size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-10">
                                            1-10 employees
                                        </SelectItem>
                                        <SelectItem value="11-50">
                                            11-50 employees
                                        </SelectItem>
                                        <SelectItem value="51-200">
                                            51-200 employees
                                        </SelectItem>
                                        <SelectItem value="201-500">
                                            201-500 employees
                                        </SelectItem>
                                        <SelectItem value="501+">
                                            501+ employees
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="organizationType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Organization Type{' '}
                                <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select organization type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="startup">
                                            Startup
                                        </SelectItem>
                                        <SelectItem value="enterprise">
                                            Enterprise
                                        </SelectItem>
                                        <SelectItem value="agency">
                                            Agency
                                        </SelectItem>
                                        <SelectItem value="nonprofit">
                                            Non-profit
                                        </SelectItem>
                                        <SelectItem value="education">
                                            Education
                                        </SelectItem>
                                        <SelectItem value="government">
                                            Government
                                        </SelectItem>
                                        <SelectItem value="other">
                                            Other
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}
