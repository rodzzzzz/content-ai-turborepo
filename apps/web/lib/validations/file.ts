import { z } from 'zod';

export const fileRenameSchema = z.object({
    name: z.string().min(1, { message: 'File name is required' }),
    folderId: z.optional(z.string()),
});

export const fileMoveSchema = z.object({
    folderId: z.string().min(1, { message: 'Folder is required' }),
});

export const folderCreateSchema = z.object({
    name: z.string().min(1, { message: 'Folder name is required' }),
});

export const folderUpdateSchema = z.object({
    name: z.string().min(1, { message: 'Folder name is required' }),
});
