'use server';

import { currentUser } from '@/lib/auth';
import { UTApi } from 'uploadthing/server';
import sharp from 'sharp';

/**
 * Upload result metadata from UploadThing
 */
export interface UploadFromUrlResult {
    url: string;
    key: string;
    name: string;
    type: string;
    size: number;
}

/**
 * Download image from URL and upload to UploadThing
 * Accepts PNG, JPEG, WebP, and SVG formats
 * Converts WebP to JPEG and SVG to PNG
 * Returns the UploadThing file metadata or null on failure
 * Does NOT create a File record in the database
 */
export async function uploadImageFromUrlToUploadThing(
    imageUrl: string,
    baseUrl?: string,
): Promise<UploadFromUrlResult | null> {
    try {
        const user = await currentUser();

        if (!user || !user.id || !user.organizationId) {
            throw new Error('Unauthorized');
        }

        let buffer: Buffer;
        let contentType: string;
        let extension: string;

        // Handle data URLs (base64, UTF-8, or URL-encoded)
        if (imageUrl.startsWith('data:image/')) {
            // Match data URL format: data:image/<type>[;encoding],<data>
            // Supports base64, charset=utf-8, charset=UTF-8, utf8, utf-8, or no encoding
            const matches = imageUrl.match(
                /^data:image\/(png|jpeg|webp|svg\+xml)(?:;(?:base64|charset=[^,]+|utf8|utf-8))?,(.+)$/i,
            );

            if (!matches) {
                throw new Error(
                    'Invalid data URL format. Only PNG, JPEG, WebP, and SVG are allowed.',
                );
            }

            const [, imageType, data] = matches;
            const isBase64 = imageUrl.toLowerCase().includes(';base64,');

            // Decode data based on encoding
            if (isBase64) {
                buffer = Buffer.from(data, 'base64');
            } else {
                // Handle text-encoded data (like SVG with UTF-8 or URL encoding)
                // Decode URL-encoded characters if present
                buffer = Buffer.from(decodeURIComponent(data), 'utf-8');
            }

            // Convert formats as needed
            if (imageType === 'webp') {
                buffer = await sharp(buffer).jpeg().toBuffer();
                contentType = 'image/jpeg';
                extension = 'jpg';
            } else if (imageType === 'svg+xml') {
                buffer = await sharp(buffer).png().toBuffer();
                contentType = 'image/png';
                extension = 'png';
            } else {
                contentType = `image/${imageType}`;
                extension = imageType === 'jpeg' ? 'jpg' : 'png';
            }
        } else {
            // Handle regular URLs
            let absoluteUrl = imageUrl;
            if (baseUrl && !imageUrl.startsWith('http')) {
                const base = new URL(baseUrl);
                absoluteUrl = new URL(imageUrl, base).toString();
            }

            // Download image
            const response = await fetch(absoluteUrl, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to download image: ${response.statusText}`,
                );
            }

            // Validate content type - accept PNG, JPEG, WebP, and SVG
            const responseContentType =
                response.headers.get('content-type') || '';

            if (
                responseContentType !== 'image/png' &&
                responseContentType !== 'image/jpeg' &&
                responseContentType !== 'image/jpg' &&
                responseContentType !== 'image/webp' &&
                responseContentType !== 'image/svg+xml'
            ) {
                throw new Error(
                    'Only PNG, JPEG, WebP, and SVG images are allowed.',
                );
            }

            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);

            // Convert formats as needed
            if (responseContentType === 'image/webp') {
                buffer = await sharp(buffer).jpeg().toBuffer();
                contentType = 'image/jpeg';
                extension = 'jpg';
            } else if (responseContentType === 'image/svg+xml') {
                buffer = await sharp(buffer).png().toBuffer();
                contentType = 'image/png';
                extension = 'png';
            } else {
                contentType = responseContentType;
                extension =
                    contentType.includes('jpeg') || contentType.includes('jpg')
                        ? 'jpg'
                        : 'png';
            }
        }

        // Create File object and upload
        const uint8Array = new Uint8Array(buffer);
        const fileName = `upload-${Date.now()}.${extension}`;
        const file = new File([uint8Array], fileName, { type: contentType });

        const utapi = new UTApi();
        const uploadResult = await utapi.uploadFiles(file);

        if (uploadResult.error) {
            throw new Error(
                `Failed to upload image: ${uploadResult.error.message}`,
            );
        }

        return {
            url: uploadResult.data.ufsUrl,
            key: uploadResult.data.key,
            name: uploadResult.data.name,
            type: uploadResult.data.type || contentType,
            size: uploadResult.data.size,
        };
    } catch (error) {
        console.error('Error uploading image from URL:', error);
        return null;
    }
}
