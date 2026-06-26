'use client';

import {
    Loader2,
    PlusCircle,
    SaveIcon,
    Trash2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFieldArray, useForm } from 'react-hook-form';
import { faqSchema, FAQFormValues } from '@/lib/validations/faq';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    Form,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useSaveFAQs, useDeleteFAQs } from '@/hooks/use-knowledge-mutations';
import { useFAQs } from '@/hooks/use-knowledge-query';
import { z } from 'zod';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '../ui/badge';

type FAQFormData = {
    faqs: Array<FAQFormValues & { id?: string }>;
};

export default function FAQ() {
    const [savingIndex, setSavingIndex] = useState<number | null>(null);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
    const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
        new Set(),
    );
    const { toast } = useToast();
    const { data: existingFAQs = [], isLoading: isFAQsLoading } = useFAQs();
    const { mutateAsync: saveFAQs } = useSaveFAQs();
    const { mutateAsync: deleteFAQ } = useDeleteFAQs();

    const form = useForm<FAQFormData>({
        resolver: zodResolver(z.object({ faqs: z.array(faqSchema) })),
        defaultValues: {
            faqs: existingFAQs.map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
            })),
        },
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'faqs',
    });

    useEffect(() => {
        if (existingFAQs.length > 0) {
            form.reset({
                faqs: existingFAQs.map((faq) => ({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                })),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [existingFAQs]);

    // Watch the faqs field to check for empty values
    const faqs = form.watch('faqs');
    const { dirtyFields } = form.formState;

    // Check if the last FAQ has empty question and answer
    const isLastFAQEmpty =
        fields.length > 0 &&
        (!faqs[fields.length - 1]?.question?.trim() ||
            !faqs[fields.length - 1]?.answer?.trim());

    const handleSaveFAQ = async (index: number) => {
        try {
            setSavingIndex(index);
            const faq = faqs[index];

            if (!faq.question.trim() || !faq.answer.trim()) {
                toast({
                    title: 'Validation Error',
                    description: 'Both question and answer are required.',
                    variant: 'destructive',
                });
                return;
            }

            await saveFAQs({
                id: faq.id || '',
                faq: {
                    question: faq.question,
                    answer: faq.answer,
                },
            });

            // Reset the dirty state for this FAQ
            form.resetField(`faqs.${index}.question`);
            form.resetField(`faqs.${index}.answer`);

            toast({
                title: 'Success',
                description: 'FAQ saved successfully',
            });
        } catch (error) {
            console.error('Error saving FAQ:', error);
            toast({
                title: 'Error',
                description: 'Failed to save FAQ',
                variant: 'destructive',
            });
        } finally {
            setSavingIndex(null);
        }
    };

    const handleAddFAQ = () => {
        if (isLastFAQEmpty) {
            toast({
                title: 'Cannot add new FAQ',
                description:
                    'Please fill in the current FAQ before adding a new one.',
                variant: 'destructive',
            });
            return;
        }
        append({ question: '', answer: '' });
    };

    const handleRemoveFAQ = async (index: number) => {
        const faq = faqs[index];

        // If it's a new FAQ (no ID), just remove it from the form
        if (!faq.id) {
            remove(index);
            return;
        }

        try {
            setDeletingIndex(index);
            await deleteFAQ(faq.id);
            remove(index);
            toast({
                title: 'Success',
                description: 'FAQ deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete FAQ',
                variant: 'destructive',
            });
        } finally {
            setDeletingIndex(null);
        }
    };

    const toggleExpand = (index: number) => {
        setExpandedIndices((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const isDisabledInput = savingIndex !== null || deletingIndex !== null;

    if (isFAQsLoading) {
        return <FAQSkeleton />;
    }

    return (
        <Form {...form}>
            <form>
                <Card className="mt-6 border-0 lg:mt-0 lg:border">
                    <CardHeader className="flex flex-row items-center justify-between p-0 pb-6 lg:p-6">
                        <div className="flex flex-col gap-1">
                            <CardTitle>Additional Information</CardTitle>
                            <CardDescription>
                                Include FAQs to train the bot to handle missing
                                information to a question.
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={handleAddFAQ}
                            disabled={isLastFAQEmpty || isDisabledInput}
                        >
                            <PlusCircle className="h-4 w-4" />
                            Add Q&A
                        </Button>
                    </CardHeader>
                    {fields.length > 0 && (
                        <>
                            <Separator className="hidden lg:block" />
                            <CardContent className="p-0 pt-6 lg:p-6">
                                <div className="space-y-4">
                                    {fields.map((field, index) => {
                                        const isValid =
                                            faqs[index]?.question?.trim() &&
                                            faqs[index]?.answer?.trim();
                                        const isLoading =
                                            savingIndex === index ||
                                            deletingIndex === index;
                                        const isDirty =
                                            dirtyFields.faqs?.[index]
                                                ?.question ||
                                            dirtyFields.faqs?.[index]?.answer ||
                                            !faqs[index].id;
                                        const isExpanded =
                                            expandedIndices.has(index);
                                        const hasNoId = !faqs[index].id;

                                        return (
                                            <Collapsible
                                                key={field.id}
                                                open={isExpanded}
                                                onOpenChange={() =>
                                                    toggleExpand(index)
                                                }
                                                className="rounded-lg border bg-white shadow"
                                            >
                                                <div className="flex items-center justify-between p-4">
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex w-full items-center justify-between gap-2 p-0 hover:bg-transparent"
                                                        >
                                                            <span className="truncate text-left">
                                                                {faqs[index]
                                                                    ?.question ||
                                                                    'New FAQ'}
                                                                {hasNoId && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="ml-2"
                                                                    >
                                                                        Unsaved
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-4 w-4 shrink-0" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 shrink-0" />
                                                            )}
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                </div>
                                                <CollapsibleContent className="space-y-4 p-4 pt-0">
                                                    <FormField
                                                        control={form.control}
                                                        name={`faqs.${index}.question`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="mb-1.5 block text-sm font-medium">
                                                                    Question
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="ex. When is the webinar?"
                                                                        disabled={
                                                                            isLoading ||
                                                                            isDisabledInput
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`faqs.${index}.answer`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="mb-1.5 block text-sm font-medium">
                                                                    Answer
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        {...field}
                                                                        placeholder="ex. The webinar is on June 1st at 10am"
                                                                        rows={3}
                                                                        disabled={
                                                                            isLoading ||
                                                                            isDisabledInput
                                                                        }
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            type="button"
                                                            disabled={
                                                                isLoading ||
                                                                !isValid ||
                                                                isDisabledInput ||
                                                                !isDirty
                                                            }
                                                            onClick={() =>
                                                                handleSaveFAQ(
                                                                    index,
                                                                )
                                                            }
                                                        >
                                                            {savingIndex ===
                                                            index ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <SaveIcon className="h-4 w-4" />
                                                            )}
                                                            Save
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                handleRemoveFAQ(
                                                                    index,
                                                                )
                                                            }
                                                            disabled={
                                                                isLoading ||
                                                                isDisabledInput
                                                            }
                                                        >
                                                            {deletingIndex ===
                                                            index ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </form>
        </Form>
    );
}

const FAQSkeleton = () => {
    return (
        <Card className="mt-6 border-0 lg:mt-0 lg:border">
            <CardHeader className="flex flex-row items-center justify-between p-0 pb-6 lg:p-6">
                <div className="flex flex-col gap-1">
                    <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
                    <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-9 w-[150px] animate-pulse rounded-md bg-muted" />
            </CardHeader>
        </Card>
    );
};
