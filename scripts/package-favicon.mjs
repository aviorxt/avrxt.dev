import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/package-favicon.mjs <generated-square-master.png>');
const output = path.resolve(process.argv[3] || 'public/brand/avrxt-selected');
await fs.mkdir(output, { recursive: true });
const sizes = [16, 32, 48, 64, 128, 256];
const frames = await Promise.all(sizes.map(size => sharp(input).resize(size, size, { fit: 'contain', background: '#050505' }).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let index = 0; index < sizes.length; index++) {
    const entry = 6 + index * 16;
    header[entry] = sizes[index] === 256 ? 0 : sizes[index];
    header[entry + 1] = header[entry];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(frames[index].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += frames[index].length;
}
await fs.writeFile(path.join(output, 'favicon.ico'), Buffer.concat([header, ...frames]));
for (const size of [32, 192, 512]) await sharp(input).resize(size, size).png().toFile(path.join(output, `icon-${size}.png`));
await sharp(input).resize(180, 180).png().toFile(path.join(output, 'apple-touch-icon.png'));
console.log('Created six-size ICO, 32/192/512 PNG icons and 180px Apple touch icon.');
