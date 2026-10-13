export class R2UploadError extends Error {
    constructor(message: string, readonly retryable: boolean) { super(message); this.name = 'R2UploadError'; }
}
export async function putR2File(file: File, prepared: { uploadUrl: string; contentType: string }) {
    let response: Response;
    try {
        response = await fetch(prepared.uploadUrl, {
            method: 'PUT', body: file, credentials: 'omit',
            headers: { 'Content-Type': prepared.contentType }, signal: AbortSignal.timeout(file.size > 25 * 1024 ** 2 ? 600_000 : 180_000),
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') throw new R2UploadError('Upload timed out. Check your connection and try again.', true);
        throw new R2UploadError('R2 could not be reached. Check your connection; if this persists, check the bucket CORS origin and PUT method.', true);
    }
    if (!response.ok) {
        const body = await response.text();
        const code = body.match(/<Code>([A-Za-z0-9]+)<\/Code>/)?.[1];
        throw new R2UploadError(`Upload rejected (${response.status}${code ? `, ${code}` : ''}). Check the R2 credentials and retry.`, [408, 429, 500, 502, 503, 504].includes(response.status) || ['ExpiredRequest', 'RequestExpired'].includes(code || ''));
    }
}
