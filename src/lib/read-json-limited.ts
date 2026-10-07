export class RequestBodyError extends Error {
    constructor(readonly status: 400 | 413, message: string) {
        super(message);
        this.name = 'RequestBodyError';
    }
}

export async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown> {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > maxBytes) throw new RequestBodyError(413, 'Request is too large.');
    if (!request.body) throw new RequestBodyError(400, 'Invalid JSON body.');

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
            await reader.cancel();
            throw new RequestBodyError(413, 'Request is too large.');
        }
        chunks.push(value);
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try {
        return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    } catch {
        throw new RequestBodyError(400, 'Invalid JSON body.');
    }
}
