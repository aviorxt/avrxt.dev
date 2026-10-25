import { completeR2UploadAction, getPresignedR2UrlAction, refreshR2UploadAction } from '@/app/actions/r2';
import { putR2File } from '@/lib/upload-transport';
import { recoverR2Upload } from '@/lib/upload-recovery';

export async function uploadToR2(file: File) {
    const prepared = await getPresignedR2UrlAction(file.name, file.type, file.size);
    if ('error' in prepared) throw new Error(prepared.error);
    await recoverR2Upload(prepared, {
        put: current => putR2File(file, current),
        verify: async current => {
            const completed = await completeR2UploadAction(current.key, current.contentType, file.size);
            if ('error' in completed) throw new Error(completed.error);
        },
        refresh: async current => {
            const refreshed = await refreshR2UploadAction(current.key, current.contentType, file.size);
            if ('error' in refreshed) throw new Error(refreshed.error);
            return refreshed;
        },
    });
    return { publicUrl: prepared.publicUrl, fileName: prepared.fileName };
}
