// Generates PNG app icons without any third-party dependencies.
// Draws the same "snake + apple on an LCD screen" motif as icon.svg into a
// raw pixel buffer and encodes it as a PNG using Node's built-in zlib.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "icons");
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // no filter
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const px = (x, y, [r, g, b, a = 255]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };
  const rect = (x, y, w, h, color) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, color);
  };
  const disc = (cx, cy, rad, color) => {
    for (let yy = cy - rad; yy <= cy + rad; yy++)
      for (let xx = cx - rad; xx <= cx + rad; xx++) {
        const dx = xx - cx;
        const dy = yy - cy;
        if (dx * dx + dy * dy <= rad * rad) px(xx, yy, color);
      }
  };

  const s = size / 512; // design in 512-space
  const S = (v) => Math.round(v * s);

  rect(0, 0, size, size, [12, 31, 22]); // background
  rect(S(96), S(96), S(320), S(320), [15, 42, 30]); // screen
  // screen border
  const bw = S(6);
  rect(S(96), S(96), S(320), bw, [155, 227, 74]);
  rect(S(96), S(410) - bw, S(320), bw, [155, 227, 74]);
  rect(S(96), S(96), bw, S(320), [155, 227, 74]);
  rect(S(410) - bw, S(96), bw, S(320), [155, 227, 74]);

  const green = [155, 227, 74];
  const head = [215, 255, 166];
  rect(S(140), S(300), S(40), S(40), green);
  rect(S(180), S(300), S(40), S(40), green);
  rect(S(220), S(300), S(40), S(40), green);
  rect(S(220), S(260), S(40), S(40), green);
  rect(S(220), S(220), S(40), S(40), green);
  rect(S(260), S(220), S(40), S(40), head);
  disc(S(330), S(170), S(24), [229, 72, 77]); // apple
  rect(S(326), S(138), S(8), S(16), [122, 74, 31]); // stem

  return encodePng(size, size, buf);
}

for (const size of [192, 512]) {
  const png = makeIcon(size);
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}
