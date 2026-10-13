export const R2_UPLOAD_ORIGINS = [
    'https://avrxt.dev', 'https://www.avrxt.dev', 'https://staging.avrxt.dev',
    'http://localhost:3000', 'http://localhost:3007',
] as const;

export function assertR2UploadOrigin(origin: string) {
    const allowed = new Set<string>([
        ...R2_UPLOAD_ORIGINS,
        process.env.NEXT_PUBLIC_SITE_URL?.trim() || '',
        ...(process.env.R2_UPLOAD_ORIGINS || '').split(',').map(value => value.trim()),
    ]);
    if (!allowed.has(origin)) throw new Error('This site origin is not configured for uploads. Add it to R2_UPLOAD_ORIGINS and the bucket CORS policy.');
}
