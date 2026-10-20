import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style?: 'normal' | 'italic';
};

async function loadFont(fileName: string) {
  // A filesystem path is compatible with both Next.js 15's static image build
  // and Amplify's Node compute runtime. `new URL(..., import.meta.url)` is not.
  const font = await readFile(join(process.cwd(), 'src', 'app', '_og', 'fonts', fileName));
  return font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer;
}

export async function getOgFonts(): Promise<OgFont[]> {
  const spaceMono = await loadFont('SpaceMono-Regular.ttf');

  return [
    { name: 'Space Mono', data: spaceMono, weight: 400, style: 'normal' },
  ];
}
