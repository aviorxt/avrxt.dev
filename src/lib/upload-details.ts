export const UPLOAD_TYPES: Record<string, { extension: string; folder: 'i' | 'v'; maxBytes: number }> = {
  'image/jpeg': { extension: 'jpg', folder: 'i', maxBytes: 10 * 1024 ** 2 },
  'image/png': { extension: 'png', folder: 'i', maxBytes: 10 * 1024 ** 2 },
  'image/webp': { extension: 'webp', folder: 'i', maxBytes: 10 * 1024 ** 2 },
  'image/gif': { extension: 'gif', folder: 'i', maxBytes: 10 * 1024 ** 2 },
  'image/avif': { extension: 'avif', folder: 'i', maxBytes: 10 * 1024 ** 2 },
  'video/mp4': { extension: 'mp4', folder: 'v', maxBytes: 100 * 1024 ** 2 },
  'video/webm': { extension: 'webm', folder: 'v', maxBytes: 100 * 1024 ** 2 },
  'video/ogg': { extension: 'ogv', folder: 'v', maxBytes: 100 * 1024 ** 2 },
  'audio/mpeg': { extension: 'mp3', folder: 'v', maxBytes: 25 * 1024 ** 2 },
  'audio/wav': { extension: 'wav', folder: 'v', maxBytes: 25 * 1024 ** 2 },
  'audio/ogg': { extension: 'ogg', folder: 'v', maxBytes: 25 * 1024 ** 2 },
  'audio/mp4': { extension: 'm4a', folder: 'v', maxBytes: 25 * 1024 ** 2 },
  'audio/flac': { extension: 'flac', folder: 'v', maxBytes: 25 * 1024 ** 2 },
};
export function uploadDetails(name: string, mime: string, size: number) {
  const aliases: Record<string, string> = { 'image/jpg': 'image/jpeg', 'audio/x-wav': 'audio/wav', 'audio/wave': 'audio/wav', 'audio/x-flac': 'audio/flac' };
  const rawType = mime.trim().toLowerCase().split(';')[0];
  const inferred: Record<string,string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', mp4: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac' };
  const contentType = aliases[rawType] || (!rawType || rawType === 'application/octet-stream' ? inferred[name.split('.').pop()?.toLowerCase() || ''] || '' : rawType);
  const type = UPLOAD_TYPES[contentType];
  if (!name || name.length > 255 || !type || !Number.isSafeInteger(size) || size < 1 || size > type.maxBytes) {
    throw new Error('Unsupported file type or file size. Images: 10 MB; audio: 25 MB; video: 100 MB.');
  }
  const fileName = `avrxt-${crypto.randomUUID()}.${type.extension}`;
  return { ...type, contentType, fileName };
}
export function validateR2UploadKey(key: string, contentType: string, size: number) {
  const type = UPLOAD_TYPES[contentType];
  const match = typeof key === 'string' && key.match(/^([iv])\/(avrxt-[a-f0-9-]{36}\.([a-z0-9]+))$/);
  if (!type || !match || match[1] !== type.folder || match[3] !== type.extension || !Number.isSafeInteger(size) || size < 1 || size > type.maxBytes) throw new Error('Invalid upload details.');
  return { folder: type.folder, fileName: match[2] };
}
