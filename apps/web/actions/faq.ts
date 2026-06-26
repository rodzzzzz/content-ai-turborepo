'use server';

import { currentUser } from '@/lib/auth';
import {
    fetchVectorMetadatasByNamespace,
    generateEmbedding,
    storeVector,
    deleteVector,
} from '@/lib/vector-client';
import { db } from '@/lib/db';
import { isEmpty } from 'lodash';
import { FAQData, FAQFormValues } from '@/lib/validations/faq';

export async function saveFAQs(id: string, faq: FAQFormValues) {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        const embedding = await generateEmbedding(
            `${faq.question}\n${faq.answer}`,
        );
        const dateNow = new Date().toISOString();

        let vectorId = id;

        // Store new FAQ vector
        if (!id) {
            const newVectorId = crypto.randomUUID();

            // Update personality with new FAQ vector IDs
            await db.personality.upsert({
                where: {
                    userId: user.id!,
                },
                create: {
                    userId: user.id!,
                    organizationId: user.organizationId!,
                    faqVectorIds: [newVectorId],
                },
                update: {
                    faqVectorIds: {
                        push: newVectorId,
                    },
                },
            });

            vectorId = newVectorId;
        }

        await storeVector(
            `faq:${user.id!}:${user.organizationId!}`,
            vectorId,
            embedding,
            {
                question: faq.question,
                answer: faq.answer,
                userId: user.id!,
                id: vectorId,
                refreshedAt: dateNow,
            },
        );

        const data: FAQData = {
            id: vectorId,
            question: faq.question,
            answer: faq.answer,
            refreshedAt: dateNow,
            userId: user.id!,
        };

        return { success: true, data };
    } catch (error) {
        console.error('[SAVE_FAQS_ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function getFAQs(): Promise<FAQData[]> {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        const personality = await db.personality.findUnique({
            where: {
                userId: user.id!,
                organizationId: user.organizationId!,
            },
            select: {
                faqVectorIds: true,
            },
        });

        if (!personality || isEmpty(personality.faqVectorIds)) {
            return [];
        }

        const vectorMetadatas = await fetchVectorMetadatasByNamespace(
            `faq:${user.id!}:${user.organizationId!}`,
            personality.faqVectorIds,
        );

        const faqs = vectorMetadatas.map((metadata) => ({
            id: metadata?.metadata?.id || '',
            question: metadata?.metadata?.question || '',
            answer: metadata?.metadata?.answer || '',
            refreshedAt: metadata?.metadata?.refreshedAt,
        })) as FAQData[];

        return faqs;
    } catch (error) {
        console.error('[GET_FAQS_ERROR]', error);
        throw error;
    }
}

export async function deleteFAQs(faqId: string) {
    try {
        const user = await currentUser();
        if (!user) {
            throw new Error('Unauthorized');
        }

        // Delete the vectors from Upstash
        await deleteVector(`faq:${user.id!}:${user.organizationId!}`, faqId);

        // Update the Personality model to remove the vectorIds
        const personality = await db.personality.findUnique({
            where: {
                userId: user.id!,
                organizationId: user.organizationId!,
            },
            select: {
                faqVectorIds: true,
            },
        });

        if (personality) {
            await db.personality.update({
                where: {
                    userId: user.id!,
                },
                data: {
                    faqVectorIds: {
                        set: personality.faqVectorIds.filter(
                            (id) => id !== faqId,
                        ),
                    },
                },
            });
        }

        return { success: true };
    } catch (error) {
        console.error('[DELETE_FAQS_ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
