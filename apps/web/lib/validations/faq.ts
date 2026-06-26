import { z } from 'zod';

export const faqSchema = z.object({
    id: z.string().optional(),
    question: z.string().min(1, 'Question cannot be empty'),
    answer: z.string().min(1, 'Answer cannot be empty'),
});

export type FAQFormValues = z.infer<typeof faqSchema>;

export type FAQData = {
    id: string;
    question: string;
    answer: string;
    userId: string;
    refreshedAt: string;
};
