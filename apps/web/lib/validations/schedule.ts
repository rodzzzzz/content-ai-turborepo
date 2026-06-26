import { z } from 'zod';
import { Platform, Status } from '@prisma/client';

export const scheduleCreateSchema = z.object({
    content: z.string(),
    date: z.union([z.string().datetime(), z.date(), z.string()]).refine(
        (val) => {
            const date = val instanceof Date ? val : new Date(val);
            return !isNaN(date.getTime());
        },
        { message: 'Invalid date format' },
    ),
    platform: z.enum(Object.values(Platform) as [string, ...string[]]),
    mediaUrl: z.array(z.string()),
    status: z.enum(Object.values(Status) as [string, ...string[]]),
});

export const scheduleUpdateSchema = scheduleCreateSchema.partial();
