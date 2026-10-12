import { S3Client, PutObjectCommand, DeleteObjectCommand, GetBucketCorsCommand, PutBucketCorsCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { CORSRule } from '@aws-sdk/client-s3';

const DEFAULT_CDN_URL = "https://cdn.avrxt.dev";

function requireEnv(name: string) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing required R2 configuration: ${name}`);
    return value;
}

function getCdnBaseUrl(folder: 'i' | 'v') {
    const configured = folder === 'i'
        ? process.env.NEXT_PUBLIC_R2_IMAGE_DOMAIN
        : process.env.NEXT_PUBLIC_R2_VIDEO_DOMAIN;
    const value = configured?.trim() || process.env.NEXT_PUBLIC_R2_DOMAIN?.trim() || DEFAULT_CDN_URL;
    return (/^https?:\/\//i.test(value) ? value : `https://${value}`).replace(/\/$/, "");
}

let r2Client: S3Client | undefined;

export function getR2Client() {
    if (!r2Client) {
        r2Client = new S3Client({
            region: "auto",
            endpoint: getR2Endpoint(),
            // A presign with no Body must not sign the checksum of an empty file.
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
            maxAttempts: 2,
            requestHandler: { connectionTimeout: 5000, requestTimeout: 15000 },
            credentials: {
                accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
                secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
            },
        });
    }
    return r2Client;
}

export async function uploadFile(buffer: Buffer, fileName: string, contentType: string, folder: 'i' | 'v') {
    const bucketName = requireEnv('R2_BUCKET_NAME');
    const key = `${folder}/${fileName}`;

    await getR2Client().send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );

    return `${getCdnBaseUrl(folder)}/${folder}/${encodeURIComponent(fileName)}`;
}

export async function getPresignedUploadUrl(fileName: string, contentType: string, folder: 'i' | 'v') {
    const bucketName = requireEnv('R2_BUCKET_NAME');
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    // Short-lived upload URLs reduce the window for reuse if one is exposed.
    const url = await getSignedUrl(getR2Client(), command, { expiresIn: 600, signableHeaders: new Set(['content-type']) });

    const publicUrl = `${getCdnBaseUrl(folder)}/${folder}/${encodeURIComponent(fileName)}`;

    return { uploadUrl: url, publicUrl, key };
}

export async function deleteFile(url: string) {
    // Extract key from URL
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        // Values such as built-in icon names are not R2 URLs.
        return;
    }
    const allowedHosts = new Set([getCdnBaseUrl('i'), getCdnBaseUrl('v')].map(value => new URL(value).host));
    if (!allowedHosts.has(parsed.host)) return;

    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    if (!/^[iv]\/.+/.test(key)) return;

    const bucketName = requireEnv('R2_BUCKET_NAME');
    await getR2Client().send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

export function getR2Endpoint() {
    const endpoint = new URL(requireEnv('R2_ENDPOINT'));
    if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.r2.cloudflarestorage.com') ||
        endpoint.username || endpoint.password || endpoint.port || !['', '/'].includes(endpoint.pathname) || endpoint.search || endpoint.hash) {
        throw new Error('R2_ENDPOINT must be the HTTPS Cloudflare S3 API endpoint, without a bucket or CDN path.');
    }
    return endpoint.origin;
}
const corsReady = new Set<string>();
export async function ensureR2Cors(origin: string) {
    const bucket = requireEnv('R2_BUCKET_NAME');
    const trusted = new Set(['https://avrxt.dev', 'https://www.avrxt.dev', 'http://localhost:3000', process.env.NEXT_PUBLIC_SITE_URL, ...(process.env.R2_UPLOAD_ORIGINS || '').split(',').map(value => value.trim())]);
    if (!trusted.has(origin)) throw new Error('This upload origin is not configured in R2_UPLOAD_ORIGINS.');
    if (corsReady.has(origin)) return;
    let rules: CORSRule[];
    try { rules = (await getR2Client().send(new GetBucketCorsCommand({ Bucket: bucket }))).CORSRules || []; }
    catch (error) {
        if (!(error instanceof Error) || error.name !== 'NoSuchCORSConfiguration') throw error;
        rules = [];
    }
    if (!rules.some(rule => (rule.AllowedOrigins?.includes(origin) || rule.AllowedOrigins?.includes('*')) && rule.AllowedMethods?.includes('PUT') &&
        rule.AllowedHeaders?.some(header => header === '*' || header.toLowerCase() === 'content-type'))) {
        await getR2Client().send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules: [
            ...rules, { AllowedOrigins: [origin], AllowedMethods: ['GET', 'HEAD', 'PUT'], AllowedHeaders: ['Content-Type'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 3600 },
        ] } }));
    }
    corsReady.add(origin);
}
export async function verifyR2Upload(key: string, contentType: string, size: number) {
    if (!/^[iv]\/avrxt-[a-f0-9-]{36}\.[a-z0-9]+$/.test(key)) throw new Error('Invalid upload key.');
    const object = await getR2Client().send(new HeadObjectCommand({ Bucket: requireEnv('R2_BUCKET_NAME'), Key: key }));
    if (object.ContentLength !== size || object.ContentType !== contentType) {
        await getR2Client().send(new DeleteObjectCommand({ Bucket: requireEnv('R2_BUCKET_NAME'), Key: key }));
        throw new Error('Uploaded file does not match the approved size or type.');
    }
}
