'use server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { UTApi } from 'uploadthing/server';
import { UploadStatus } from '@prisma/client';

export async function uploadAIGeneratedImage(base64Data: string) {
    const user = await currentUser();

    if (!user || !user.id) {
        throw new Error('Unauthorized');
    }

    const utapi = new UTApi();

    try {
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Create a File object from the buffer
        const file = new File([buffer], `ai-generated-${Date.now()}.png`, {
            type: 'image/png',
        });

        // Upload to UploadThing
        const uploadResult = await utapi.uploadFiles(file);

        if (uploadResult.error) {
            throw new Error(
                `Failed to upload image: ${uploadResult.error.message}`,
            );
        }

        // Store file metadata in database
        const newFile = await db.file.create({
            data: {
                key: uploadResult.data.key,
                url: uploadResult.data.ufsUrl,
                userId: user.id,
                name: uploadResult.data.name,
                uploadStatus: UploadStatus.SUCCESS,
                fileType: uploadResult.data.type || 'image/png',
                fileSize: uploadResult.data.size,
                organizationId: user.organizationId,
            },
        });

        return {
            url: uploadResult.data.ufsUrl,
            key: uploadResult.data.key,
            fileId: newFile.id,
        };
    } catch (error) {
        console.error('Error uploading AI-generated image:', error);
        throw new Error('Failed to upload AI-generated image');
    }
}
