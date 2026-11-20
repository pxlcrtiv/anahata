/**
 * Generates Anahata's PWA icons with zero dependencies (Node + zlib only).
 *
 * The mark: matte-black rounded square (the chassis), a centered green disc
 * (the play disc — the app's signature control per DESIGN.md), with the play
 * glyph cut dark out of the disc. Maskable-safe: the disc sits well inside
 * the launcher-safe central 80%.
 *
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons');

const GREEN = [0x22, 0xc5, 0x5e]; // Power LED Green
const BLACK = [0x00, 0x00, 0x00]; // Chassis Black

// ---------- PNG encoding ----------

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
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < width * 4; x++) {
      raw[p++] = rgba[y * width * 4 + x];
    }
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Mark geometry (normalized coordinates) ----------

const CORNER_R = 0.22; // rounded-square corner radius
const DISC_R = 0.3;     // play disc radius (maskable-safe zone is 0.4)
const TRI = [
  [0.42, 0.36],
  [0.42, 0.64],
  [0.66, 0.5],
];

function insideRoundedRect(u, v) {
  const half = 0.5;
  const x = Math.abs(u - half);
  const y = Math.abs(v - half);
  if (x <= half - CORNER_R || y <= half - CORNER_R) return true;
  const cx = half - CORNER_R;
  const cy = half - CORNER_R;
  return (x - cx) ** 2 + (y - cy) ** 2 <= CORNER_R ** 2;
}

function insideDisc(u, v) {
  return (u - 0.5) ** 2 + (v - 0.5) ** 2 <= DISC_R ** 2;
}

function insideTriangle(u, v) {
  let hasNeg = false;
  let hasPos = false;
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = TRI[i];
    const [bx, by] = TRI[(i + 1) % 3];
    const d = (u - bx) * (ay - by) - (ax - bx) * (v - by);
    if (d < 0) hasNeg = true;
    if (d > 0) hasPos = true;
  }
  return !(hasNeg && hasPos);
}

// ---------- Rendering (4x supersampled coverage) ----------

const SS = 4;

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgCov = 0;
      let discCov = 0;
      let glyphCov = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (px + (sx + 0.5) / SS) / size;
          const v = (py + (sy + 0.5) / SS) / size;
          if (!insideRoundedRect(u, v)) continue;
          bgCov++;
          if (!insideDisc(u, v)) continue;
          discCov++;
          if (insideTriangle(u, v)) glyphCov++;
        }
      }

      const total = SS * SS;
      const i = (py * size + px) * 4;

      if (bgCov === 0) {
        rgba[i + 3] = 0; // fully transparent corner
        continue;
      }

      if (glyphCov > 0) {
        const a = glyphCov / total;
        rgba[i] = BLACK[0];
        rgba[i + 1] = BLACK[1];
        rgba[i + 2] = BLACK[2];
        rgba[i + 3] = Math.round(a * 255);
      } else if (discCov > 0) {
        const a = discCov / total;
        // Green disc over the black chassis — blend coverage into alpha
        // against the known black backdrop so edges stay crisp.
        rgba[i] = GREEN[0];
        rgba[i + 1] = GREEN[1];
        rgba[i + 2] = GREEN[2];
        rgba[i + 3] = Math.round(a * 255);
      } else {
        rgba[i] = BLACK[0];
        rgba[i + 1] = BLACK[1];
        rgba[i + 2] = BLACK[2];
        rgba[i + 3] = Math.round((bgCov / total) * 255);
      }
    }
  }

  return rgba;
}

// ---------- Main ----------

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [32, 180, 192, 512]) {
  const buffer = encodePng(size, size, renderIcon(size));
  const file = resolve(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, buffer);
  console.log(`wrote ${file} (${buffer.length} bytes)`);
}
