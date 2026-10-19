'use server';

import { headers } from 'next/headers';
import { verifyAdmin } from '@/lib/auth-checks';
import { assertR2UploadOrigin } from '@/lib/r2-upload-origin';
import { uploadDetails } from '@/lib/upload-details';

type MuxUpload = { id: string; url: string };

function muxAuthorization() {
  const id = process.env.MUX_TOKEN_ID?.trim();
  const secret = process.env.MUX_TOKEN_SECRET?.trim();
  if (!id || !secret) throw new Error('Mux video is not configured yet. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET.');
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

async function muxRequest(path: string, init?: RequestInit) {
  const response = await fetch(`https://api.mux.com/video/v1${path}`, {
    ...init,
    headers: { Authorization: muxAuthorization(), 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Mux request failed (${response.status}).`);
  return response.json() as Promise<{ data: Record<string, unknown> }>;
}

export async function createMuxVideoUploadAction(fileName: string, fileType: string, fileSize: number) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: `Unauthorized: ${auth.error}` };
  try {
    const details = uploadDetails(fileName, fileType, fileSize);
    if (!details.contentType.startsWith('video/')) throw new Error('Only video files can be sent to Mux.');
    const origin = (await headers()).get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.avrxt.dev';
    assertR2UploadOrigin(origin);
    const response = await muxRequest('/uploads', {
      method: 'POST',
      body: JSON.stringify({
        cors_origin: origin,
        timeout: 3600,
        new_asset_settings: {
          playback_policies: ['public'],
          video_quality: 'basic',
          max_resolution_tier: '1080p',
          meta: { title: 'AVRXT gallery video' },
        },
      }),
    });
    const data = response.data as unknown as MuxUpload;
    if (!data.id || !data.url) throw new Error('Mux did not return an upload URL.');
    return { success: true as const, uploadId: data.id, uploadUrl: data.url };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not prepare the Mux upload.' };
  }
}

export async function getMuxVideoUploadAction(uploadId: string) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: `Unauthorized: ${auth.error}` };
  if (!/^[A-Za-z0-9]{10,128}$/.test(uploadId)) return { error: 'Invalid Mux upload reference.' };
  try {
    const upload = await muxRequest(`/uploads/${uploadId}`);
    const uploadData = upload.data as { status?: string; asset_id?: string; error?: { message?: string } };
    if (uploadData.status === 'errored' || uploadData.status === 'timed_out') return { error: uploadData.error?.message || 'Mux could not process this video.' };
    if (uploadData.status !== 'asset_created' || !uploadData.asset_id) return { success: true as const, state: 'processing' as const };

    const asset = await muxRequest(`/assets/${uploadData.asset_id}`);
    const assetData = asset.data as { status?: string; playback_ids?: Array<{ id?: string; policy?: string }> };
    const playbackId = assetData.playback_ids?.find((item) => item.policy === 'public')?.id;
    if (assetData.status !== 'ready' || !playbackId) return { success: true as const, state: 'processing' as const };
    return {
      success: true as const,
      state: 'ready' as const,
      assetId: uploadData.asset_id,
      url: `https://stream.mux.com/${playbackId}.m3u8`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not check Mux processing status.' };
  }
}

export async function deleteMuxVideoAction(assetId: string) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: `Unauthorized: ${auth.error}` };
  if (!/^[A-Za-z0-9]{10,128}$/.test(assetId)) return { error: 'Invalid Mux asset reference.' };
  try {
    await muxRequest(`/assets/${assetId}`, { method: 'DELETE' });
    return { success: true as const };
  } catch {
    return { error: 'Could not delete the Mux video. Try saving again.' };
  }
}
