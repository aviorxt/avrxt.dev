import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_CDN_URL = "https://cdn.avxt.qzz.io";

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

function getR2Client() {
    if (!r2Client) {
        r2Client = new S3Client({
            region: "auto",
            endpoint: requireEnv('R2_ENDPOINT').replace(/\/$/, ""),
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
    const url = await getSignedUrl(getR2Client(), command, { expiresIn: 600 });

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
