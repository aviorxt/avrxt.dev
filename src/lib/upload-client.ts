import { completeR2UploadAction, getPresignedR2UrlAction } from '@/app/actions/r2';
import { putR2File } from '@/lib/upload-transport';

export async function uploadToR2(file: File) {
    const prepared = await getPresignedR2UrlAction(file.name, file.type, file.size);
    if ('error' in prepared) throw new Error(prepared.error);
    await putR2File(file, prepared);
    const completed = await completeR2UploadAction(prepared.key, prepared.contentType, file.size);
    if ('error' in completed) throw new Error(completed.error);
    return { publicUrl: prepared.publicUrl, fileName: prepared.fileName };
}
