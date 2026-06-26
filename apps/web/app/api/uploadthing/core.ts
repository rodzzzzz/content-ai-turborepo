import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createMediaFileViaApi, setUserAvatarViaApi } from '@/lib/media-api';
import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { UploadStatus } from '@prisma/client';
import { z } from 'zod';

const f = createUploadthing();

const handleAuth = async () => {
    const user = await currentUser();

    if (!user) throw new UploadThingError('Unauthorized');

    return { userId: user.id, organizationId: user.organizationId };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    avatarUploader: f({
        'image/webp': {
            maxFileSize: '4MB',
            maxFileCount: 1,
        },
    })
        // Set permissions and file types for this FileRoute
        .middleware(async () => {
            // This code runs on your server before upload
            const user = await handleAuth();

            return user;
        })
        .onUploadComplete(async ({ metadata, file }) => {
            if (!metadata.userId)
                throw new UploadThingError('User ID is required');

            const isFileExists = await db.file.findFirst({
                where: {
                    key: file.key,
                },
            });

            if (isFileExists) return;

            await createMediaFileViaApi({
                organizationId: metadata.organizationId!,
                name: file.name,
                url: file.ufsUrl,
                key: file.key,
                fileType: file.type,
                fileSize: file.size,
                uploadStatus: UploadStatus.SUCCESS,
            });

            await setUserAvatarViaApi(file.ufsUrl);
        }),
    postMediaUploader: f({
        image: {
            maxFileSize: '16MB',
            minFileCount: 1,
            maxFileCount: 20,
        },
    })
        .input(z.object({ folderId: z.string().optional() }))
        .middleware(async ({ input }) => {
            const user = await handleAuth();

            // Pass the folder ID from the client input
            return {
                userId: user.userId,
                folderId: input?.folderId || null,
                organizationId: user.organizationId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            if (!metadata.userId)
                throw new UploadThingError('User ID is required');

            // Create the file with the folder ID if provided
            const newFile = await createMediaFileViaApi({
                organizationId: metadata.organizationId!,
                name: file.name,
                url: file.ufsUrl,
                key: file.key,
                fileType: file.type,
                fileSize: file.size,
                uploadStatus: UploadStatus.SUCCESS,
                folderId: metadata.folderId,
            });

            const createdAt =
                typeof newFile.createdAt === 'string'
                    ? newFile.createdAt
                    : (newFile.createdAt as Date).toISOString();
            const updatedAt =
                typeof newFile.updatedAt === 'string'
                    ? newFile.updatedAt
                    : (newFile.updatedAt as Date).toISOString();

            return {
                name: String(newFile.name),
                id: String(newFile.id),
                createdAt,
                updatedAt,
                userId: String(newFile.userId),
                uploadStatus: String(newFile.uploadStatus),
                url: String(newFile.url),
                key: String(newFile.key),
                fileType: String(newFile.fileType),
                fileSize: Number(newFile.fileSize),
                folderId: newFile.folderId ? String(newFile.folderId) : null,
            };
        }),
    aiGeneratedImageUploader: f({
        'image/png': {
            maxFileSize: '8MB',
            maxFileCount: 1,
        },
        'image/jpeg': {
            maxFileSize: '8MB',
            maxFileCount: 1,
        },
        'image/webp': {
            maxFileSize: '8MB',
            maxFileCount: 1,
        },
    })
        .input(
            z.object({
                prompt: z.string(),
                chatId: z.string().optional(),
            }),
        )
        .middleware(async ({ input }) => {
            const user = await handleAuth();

            return {
                userId: user.userId,
                organizationId: user.organizationId,
                prompt: input.prompt,
                chatId: input.chatId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            if (!metadata.userId)
                throw new UploadThingError('User ID is required');

            const newFile = await createMediaFileViaApi({
                organizationId: metadata.organizationId!,
                name: file.name,
                url: file.ufsUrl,
                key: file.key,
                fileType: file.type,
                fileSize: file.size,
                uploadStatus: UploadStatus.SUCCESS,
            });

            const createdAt =
                typeof newFile.createdAt === 'string'
                    ? newFile.createdAt
                    : (newFile.createdAt as Date).toISOString();
            const updatedAt =
                typeof newFile.updatedAt === 'string'
                    ? newFile.updatedAt
                    : (newFile.updatedAt as Date).toISOString();

            return {
                name: String(newFile.name),
                id: String(newFile.id),
                createdAt,
                updatedAt,
                userId: String(newFile.userId),
                uploadStatus: String(newFile.uploadStatus),
                url: String(newFile.url),
                key: String(newFile.key),
                fileType: String(newFile.fileType),
                fileSize: Number(newFile.fileSize),
                prompt: metadata.prompt,
                chatId: metadata.chatId ?? '',
            };
        }),
    brandKitAssetUploader: f({
        'image/png': {
            maxFileSize: '8MB',
            maxFileCount: 1,
        },
        'image/jpeg': {
            maxFileSize: '8MB',
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            const user = await handleAuth();

            return {
                userId: user.userId,
                organizationId: user.organizationId,
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            if (!metadata.userId)
                throw new UploadThingError('User ID is required');

            const isFileExists = await db.file.findFirst({
                where: {
                    key: file.key,
                },
            });

            if (isFileExists) {
                return {
                    url: file.ufsUrl,
                    key: file.key,
                };
            }

            await createMediaFileViaApi({
                organizationId: metadata.organizationId!,
                name: file.name,
                url: file.ufsUrl,
                key: file.key,
                fileType: file.type,
                fileSize: file.size,
                uploadStatus: UploadStatus.SUCCESS,
            });

            return {
                url: file.ufsUrl,
                key: file.key,
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
