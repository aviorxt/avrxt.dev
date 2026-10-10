'use server';

import { deleteFile, getPresignedUploadUrl } from '@/lib/r2';
import { verifyAdmin } from '@/lib/auth-checks';

export async function deleteFromR2Action(url: string) {
    const { authorized, error: authError } = await verifyAdmin();
    if (!authorized) {
        return { error: `Unauthorized: ${authError}` };
    }

    try {
        await deleteFile(url);
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'DELETE_FAILED' };
    }
}
export async function getPresignedR2UrlAction(fileName: string, fileType: string, fileSize: number) {
    const { authorized, error: authError } = await verifyAdmin();
    if (!authorized) {
        return { error: `Unauthorized: ${authError}` };
    }
    if (typeof fileName !== 'string' || typeof fileType !== 'string') {
        return { error: 'Invalid file details.' };
    }

    const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
    const allowedMediaTypes = new Set(['video/mp4', 'video/webm', 'video/ogg', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac']);
    const isImage = allowedImageTypes.has(fileType);
    const isMedia = allowedMediaTypes.has(fileType);
    const maxSize = fileType.startsWith('video/') ? 100 * 1024 * 1024 : fileType.startsWith('audio/') ? 25 * 1024 * 1024 : 10 * 1024 * 1024;

    if ((!isImage && !isMedia) || !Number.isSafeInteger(fileSize) || fileSize < 1 || fileSize > maxSize || fileName.length > 180) {
        return { error: 'Unsupported file type or file size.' };
    }
    const folder: 'i' | 'v' = isImage ? 'i' : 'v';

    try {
        // Use a clean, timestamped filename
        const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, '-');
        const fileExt = cleanName.split('.').pop();
        const nameWithoutExt = cleanName.split('.').slice(0, -1).join('.');
        const finalName = `${nameWithoutExt}-${Date.now()}.${fileExt}`;

        const cleanType = fileType || 'application/octet-stream';
        const data = await getPresignedUploadUrl(finalName, cleanType, folder);

        console.log(`[R2_PRESIGNED] Generated URL for ${finalName} in folder ${folder}`);

        return { success: true, ...data };
    } catch (error: any) {
        console.error('R2 Presigned URL Action Error:', error);
        return { error: error.message || 'R2_PRESIGNED_FAILED' };
    }
}
