import sharp from 'sharp';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const output = new URL('../public/newsletter/', import.meta.url);
await mkdir(new URL('fonts/', output), { recursive: true });
const star = (x,y,size=9) => `<path d="M${x-size} ${y} Q${x} ${y-2} ${x} ${y-size} Q${x+2} ${y} ${x+size} ${y} Q${x} ${y+2} ${x} ${y+size} Q${x-2} ${y} ${x-size} ${y}Z"/>`;
const wrapper = content => `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="360" viewBox="0 0 560 180"><rect width="560" height="180" fill="#0b0b0b"/><g fill="none" stroke="#dedede" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${content}</g></svg>`;
const confirmation = wrapper(`<path stroke="#333" stroke-dasharray="3 8" d="M75 123Q42 35 136 55T309 125T469 51"/><g transform="rotate(-8 260 87)"><path d="M205 53Q259 48 312 54L312 123Q260 128 205 122Z"/><path d="M207 56L259 96L310 56M206 120L246 88M310 121L273 88"/><path stroke="#666" d="M215 44Q250 39 285 43"/></g><path d="M401 63L459 40L439 91L426 73Z M402 63L425 69L459 40M426 73L425 69M425 72L420 82L430 76"/><path stroke="#888" d="M372 95Q392 106 405 94M366 109Q389 122 415 102"/>${star(135,78,10)}${star(353,47,7)}${star(176,127,5)}${star(468,127,9)}<circle cx="98" cy="101" r="3"/><circle cx="338" cy="136" r="2"/><path stroke="#777" d="M140 132L144 143M156 134L160 145M309 22L309 30M303 26L316 26"/>`);
const welcome = wrapper(`<path stroke="#333" stroke-dasharray="3 8" d="M66 111Q102 38 190 73T354 69T500 102"/><g transform="rotate(-12 276 86)"><circle cx="276" cy="86" r="38"/><ellipse cx="276" cy="86" rx="68" ry="13" transform="rotate(-20 276 86)"/><path stroke="#777" d="M257 61Q266 54 278 55M293 107Q284 117 272 117"/></g><path d="M111 87Q110 67 117 67Q123 66 123 86L123 59Q125 51 131 56L133 82L136 63Q140 57 144 64L143 87Q150 75 155 80Q159 88 148 104L141 115Q125 124 115 111Q106 101 99 97Q96 89 102 88L113 95"/><path stroke="#777" d="M93 66L88 56M104 57L102 46M150 51L157 42"/><g transform="rotate(9 421 96)"><path d="M403 76Q422 69 439 76L442 111Q421 116 402 111Z"/><path d="M411 93L420 101L433 84"/></g>${star(188,40,9)}${star(359,129,9)}${star(464,53,12)}${star(73,137,5)}<circle cx="194" cy="134" r="3"/><circle cx="380" cy="47" r="3"/><path stroke="#777" d="M490 117L490 127M485 122L496 122"/>`);
for (const [name, svg] of [['confirmation-doodle', confirmation], ['welcome-doodle', welcome]]) {
  await writeFile(new URL(`${name}.svg`, output), svg);
  await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL(`${name}.png`, output)));
}
for (const name of ['Outfit-Variable.ttf', 'SpaceMono-Regular.ttf']) await copyFile(new URL(`../src/app/_og/fonts/${name}`, import.meta.url), new URL(`fonts/${name}`, output));
