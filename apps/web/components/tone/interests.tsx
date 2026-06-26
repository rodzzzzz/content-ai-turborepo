'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFieldArray, useForm } from 'react-hook-form';
import {
    interestSchema,
    InterestFormValues,
} from '@/lib/validations/personality';
import {
    FormField,
    FormItem,
    FormControl,
    FormMessage,
    Form,
} from '@/components/ui/form';
import { Loader2, PlusCircle, SaveIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePersonality } from '@/hooks/use-personality-query';
import { useUpdateInterests } from '@/hooks/use-personality-mutations';
import { useEffect, useRef, useState } from 'react';

export default function Interests() {
    const { data, isLoading: isFetching } = usePersonality();
    const { mutate: updateInterests, isPending: isUpdating } =
        useUpdateInterests();
    const [newlyAddedIndex, setNewlyAddedIndex] = useState<number | null>(null);
    const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    const form = useForm<InterestFormValues>({
        resolver: zodResolver(interestSchema),
        defaultValues: {
            interests: [],
        },
        mode: 'onBlur',
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'interests',
    });

    useEffect(() => {
        const interests = data?.interests as
            | Array<{ value: string }>
            | null
            | undefined;
        if (interests && Array.isArray(interests) && interests.length > 0) {
            form.reset({
                interests: interests.map((interest) => ({
                    value: interest?.value || '',
                })),
            });
        } else if (
            data &&
            (!interests || !Array.isArray(interests) || interests.length === 0)
        ) {
            // If data exists but interests is null/undefined/empty, ensure at least one empty field
            form.reset({
                interests: [],
            });
        }
    }, [data, form]);

    // Focus and select text when a new interest is added
    useEffect(() => {
        if (newlyAddedIndex !== null) {
            // Use setTimeout to ensure the DOM has updated
            const timeoutId = setTimeout(() => {
                const input = inputRefs.current[newlyAddedIndex];
                if (input) {
                    input.focus();
                    input.select();
                    setNewlyAddedIndex(null);
                }
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [newlyAddedIndex, fields.length]);

    const onSubmit = (data: InterestFormValues) => {
        updateInterests(data);
        form.reset(data);
    };

    const interest = form.watch('interests') || [];
    const isLastInterestEmpty = interest[interest.length - 1]?.value === '';
    const isDirty = form.formState.isDirty;
    const isValid = form.formState.isValid;

    if (isFetching) {
        return <InterestSkeleton />;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="mt-6 border-0 lg:mt-0 lg:border">
                    <CardHeader className="flex flex-row items-center justify-between p-0 pb-6 lg:p-6">
                        <div className="flex flex-col gap-1">
                            <CardTitle>
                                Interests & Areas of Expertise
                            </CardTitle>
                            <CardDescription className="max-w-[400px]">
                                Include interests and areas of expertise to
                                train the bot to better understand the
                                user&apos;s needs.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => {
                                const newIndex = fields.length;
                                append({ value: 'New Interest' });
                                setNewlyAddedIndex(newIndex);
                            }}
                            disabled={isLastInterestEmpty || isUpdating}
                        >
                            <PlusCircle className="h-4 w-4" />
                            Add Interest
                        </Button>
                    </CardHeader>
                    {fields.length > 0 && (
                        <>
                            <Separator className="hidden lg:block" />
                            <CardContent className="p-0 pt-6 lg:p-6">
                                <div className="flex flex-col gap-4">
                                    {fields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className="flex items-center gap-2"
                                        >
                                            <FormField
                                                control={form.control}
                                                name={`interests.${index}.value`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                ref={(el) => {
                                                                    field.ref(
                                                                        el,
                                                                    );
                                                                    inputRefs.current[
                                                                        index
                                                                    ] = el;
                                                                }}
                                                                placeholder={`Interest or expertise ${index + 1}`}
                                                                disabled={
                                                                    isUpdating
                                                                }
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="destructive"
                                                onClick={() => remove(index)}
                                                disabled={
                                                    fields.length === 1 ||
                                                    isUpdating
                                                }
                                                className={cn(
                                                    'h-9 w-9',
                                                    fields.length === 1 &&
                                                        'opacity-50',
                                                )}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={
                                            isUpdating || !isDirty || !isValid
                                        }
                                    >
                                        {isUpdating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <SaveIcon className="h-4 w-4" />
                                        )}
                                        Save Interests
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </form>
        </Form>
    );
}

const InterestSkeleton = () => {
    return (
        <Card className="mt-6 border-0 lg:mt-0 lg:border">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-6 lg:p-6">
                <div className="flex flex-col gap-1">
                    <div className="h-6 w-64 animate-pulse rounded-md bg-muted" />
                    <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-9 w-[150px] animate-pulse rounded-md bg-muted" />
            </CardHeader>
        </Card>
    );
};
