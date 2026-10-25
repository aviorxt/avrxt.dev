import { R2UploadError } from './upload-transport';
export type PreparedR2Upload = { key: string; uploadUrl: string; publicUrl: string; fileName: string; contentType: string };
type UploadOperations = {
    put: (prepared: PreparedR2Upload) => Promise<void>;
    verify: (prepared: PreparedR2Upload) => Promise<void>;
    refresh: (prepared: PreparedR2Upload) => Promise<PreparedR2Upload>;
    wait?: () => Promise<void>;
};

export async function recoverR2Upload(prepared: PreparedR2Upload, operations: UploadOperations) {
    const wait = operations.wait || (() => new Promise<void>(resolve => setTimeout(resolve, 1000)));
    for (let attempt = 0; attempt < 2; attempt++) {
        try { await operations.put(prepared); }
        catch (error) {
            // A lost PUT response does not imply the object was lost. Verify before resending.
            try { await operations.verify(prepared); return prepared; } catch { /* object not yet verified */ }
            if (!(error instanceof R2UploadError) || !error.retryable || attempt === 1) throw error;
            await wait();
            const refreshed = await operations.refresh(prepared);
            if (refreshed.key !== prepared.key || refreshed.contentType !== prepared.contentType || refreshed.publicUrl !== prepared.publicUrl) throw new Error('Upload renewal changed the approved asset. Try a new upload.');
            prepared = refreshed;
            continue;
        }
        // Do not upload again just because the post-upload HEAD check briefly failed.
        try { await operations.verify(prepared); }
        catch { await wait(); await operations.verify(prepared); }
        return prepared;
    }
    throw new Error('Upload could not be completed.');
}
