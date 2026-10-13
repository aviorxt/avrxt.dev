'use server';
import { headers } from 'next/headers';
import { deleteFile, getPresignedUploadUrl, verifyR2Upload } from '@/lib/r2';
import { verifyAdmin } from '@/lib/auth-checks';
import { uploadDetails, validateR2UploadKey } from '@/lib/upload-details';
import { assertR2UploadOrigin } from '@/lib/r2-upload-origin';

export async function deleteFromR2Action(url: string) {
    const auth = await verifyAdmin();
    if (!auth.authorized) return { error: `Unauthorized: ${auth.error}` };
    try { await deleteFile(url); return { success: true }; }
    catch { return { error: 'Could not delete the stored asset. Try saving again.' }; }
}
export async function getPresignedR2UrlAction(fileName: string, fileType: string, fileSize: number) {
    const auth = await verifyAdmin();
    if (!auth.authorized) return { error: `Unauthorized: ${auth.error}` };
    try {
        if (typeof fileName !== 'string' || typeof fileType !== 'string') throw new Error('Invalid file details.');
        const details = uploadDetails(fileName, fileType, fileSize);
        const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avrxt.dev';
        assertR2UploadOrigin(origin);
        const data = await getPresignedUploadUrl(details.fileName, details.contentType, details.folder);
        return { success: true, ...data, contentType: details.contentType, fileName: details.fileName };
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Could not prepare the upload. Check R2 configuration.' };
    }
}
export async function refreshR2UploadAction(key: string, fileType: string, fileSize: number) {
    const auth = await verifyAdmin();
    if (!auth.authorized) return { error: `Unauthorized: ${auth.error}` };
    try {
        const { folder, fileName } = validateR2UploadKey(key, fileType, fileSize);
        assertR2UploadOrigin((await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avrxt.dev');
        const data = await getPresignedUploadUrl(fileName, fileType, folder);
        return { success: true, ...data, contentType: fileType, fileName };
    } catch { return { error: 'Could not renew the upload. Check your connection and retry.' }; }
}
export async function completeR2UploadAction(key: string, fileType: string, fileSize: number) {
    const auth = await verifyAdmin();
    if (!auth.authorized) return { error: `Unauthorized: ${auth.error}` };
    try {
        uploadDetails('upload', fileType, fileSize);
        await verifyR2Upload(key, fileType, fileSize);
        return { success: true };
    } catch { return { error: 'The upload could not be verified. Try again before saving.' }; }
}
