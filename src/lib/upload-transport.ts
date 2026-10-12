export async function putR2File(file: File, prepared: { uploadUrl: string; contentType: string; corsWarning?: string }) {
    let response: Response;
    try {
        response = await fetch(prepared.uploadUrl, {
            method: 'PUT', body: file, credentials: 'omit',
            headers: { 'Content-Type': prepared.contentType }, signal: AbortSignal.timeout(180_000),
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'TimeoutError') throw new Error('Upload timed out. Check your connection and try again.');
        throw new Error(prepared.corsWarning || 'R2 could not be reached. Check your connection and the bucket CORS allowed origin and PUT method.');
    }
    if (!response.ok) {
        const body = await response.text();
        const code = body.match(/<Code>([A-Za-z0-9]+)<\/Code>/)?.[1];
        throw new Error(`Upload rejected (${response.status}${code ? `, ${code}` : ''}). Check the R2 credentials and retry.`);
    }
}
