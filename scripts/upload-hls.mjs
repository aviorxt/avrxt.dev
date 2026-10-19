import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const input = process.argv[2];
if (!input) throw new Error('Usage: npm run media:hls -- <input-video-path>');
const required = name => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Export the R2 server credentials before running this script.`);
  return value;
};
const endpoint = required('R2_ENDPOINT');
const bucket = required('R2_BUCKET_NAME');
const cdn = (process.env.NEXT_PUBLIC_R2_VIDEO_DOMAIN || process.env.NEXT_PUBLIC_R2_DOMAIN || 'https://cdn.avrxt.dev').replace(/\/$/, '');
const output = mkdtempSync(join(tmpdir(), 'avrxt-hls-'));
const prefix = `v/hls-${randomUUID()}`;
try {
  execFileSync('ffmpeg', ['-y', '-i', resolve(input), '-map', '0:v:0', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-force_key_frames', 'expr:gte(t,n_forced*4)', '-hls_time', '4', '-hls_playlist_type', 'vod', '-hls_flags', 'independent_segments', '-hls_segment_filename', join(output, 'segment-%03d.ts'), '-f', 'hls', join(output, 'index.m3u8')], { stdio: 'inherit' });
  const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: required('R2_ACCESS_KEY_ID'), secretAccessKey: required('R2_SECRET_ACCESS_KEY') } });
  for (const name of readdirSync(output)) {
    const contentType = name.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: `${prefix}/${name}`, Body: readFileSync(join(output, name)), ContentType: contentType, CacheControl: name.endsWith('.m3u8') ? 'public, max-age=300' : 'public, max-age=31536000, immutable' }));
  }
  console.log(`HLS manifest: ${cdn}/${prefix}/index.m3u8`);
} finally {
  rmSync(output, { recursive: true, force: true });
}
