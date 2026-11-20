import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

const root = process.cwd();
const publicDir = resolve(root, 'public');
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf-8');

interface DecodedPng {
  width: number;
  height: number;
  data: Buffer; // raw scanlines: [filter byte | RGBA * width] * height
}

/** Decodes a filter-0 RGBA PNG once; pixels are read from the result. */
function decodePng(path: string): DecodedPng {
  const buffer = readFileSync(path);
  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    expect(buffer[i]).toBe(PNG_SIGNATURE[i]);
  }
  expect(buffer.slice(12, 16).toString('ascii')).toBe('IHDR');

  let offset = 8;
  let idat: Buffer | null = null;
  let width = 0;
  let height = 0;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
    }
    if (type === 'IDAT') {
      const chunk = buffer.slice(offset + 8, offset + 8 + length);
      idat = idat ? Buffer.concat([idat, chunk]) : chunk;
    }
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  return { width, height, data: inflateSync(idat!) };
}

function pixelAt(decoded: DecodedPng, x: number, y: number): [number, number, number, number] {
  const stride = decoded.width * 4 + 1;
  const p = y * stride + 1 + x * 4;
  return [decoded.data[p], decoded.data[p + 1], decoded.data[p + 2], decoded.data[p + 3]];
}

describe('PWA manifest', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(publicDir, 'manifest.webmanifest'), 'utf-8'),
  ) as {
    name: string;
    short_name: string;
    start_url: string;
    display: string;
    background_color: string;
    theme_color: string;
    icons: { src: string; sizes: string; type: string; purpose?: string }[];
  };

  it('declares a standalone app identity', () => {
    expect(manifest.short_name).toBe('Anahata');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/app');
    expect(manifest.background_color).toBe('#000000');
    expect(manifest.theme_color).toBe('#000000');
  });

  it('declares 192 and 512 icons in both any and maskable purposes', () => {
    const purposes = new Set(manifest.icons.map((i) => i.purpose ?? 'any'));
    expect(purposes.has('any')).toBe(true);
    expect(purposes.has('maskable')).toBe(true);

    const sizes = new Set(manifest.icons.filter((i) => i.purpose !== 'maskable').map((i) => i.sizes));
    expect(sizes.has('192x192')).toBe(true);
    expect(sizes.has('512x512')).toBe(true);
  });

  it('every declared icon exists on disk with the declared dimensions', () => {
    for (const icon of manifest.icons) {
      const path = resolve(publicDir, icon.src.replace(/^\//, ''));
      expect(existsSync(path), icon.src).toBe(true);
      const decoded = decodePng(path);
      expect(`${decoded.width}x${decoded.height}`).toBe(icon.sizes);
    }
  });
});

describe('iOS installability', () => {
  it('index.html links the manifest and the apple-touch icon', () => {
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(indexHtml).toContain('rel="apple-touch-icon"');
  });

  it('index.html carries the iOS standalone meta tags', () => {
    expect(indexHtml).toContain('name="apple-mobile-web-app-capable" content="yes"');
    expect(indexHtml).toContain('name="apple-mobile-web-app-title" content="Anahata"');
  });
});

describe('icon rendering', () => {
  it('renders the green play disc, dark glyph, and transparent corners', () => {
    const decoded = decodePng(resolve(publicDir, 'icons/icon-512.png'));

    // A point on the disc, clear of the glyph: (0.5, 0.25) normalized.
    const [r, g, b, a] = pixelAt(decoded, 256, 128);
    expect(a).toBe(255);
    expect(r).toBe(0x22);
    expect(g).toBe(0xc5);
    expect(b).toBe(0x5e);

    // The glyph center: (0.5, 0.5) normalized.
    const glyph = pixelAt(decoded, 256, 256);
    expect(glyph[3]).toBe(255);
    expect(glyph[0] + glyph[1] + glyph[2]).toBe(0);

    // The chassis: black, opaque, on the rounded square.
    const chassis = pixelAt(decoded, 20, 256);
    expect(chassis[3]).toBe(255);
    expect(chassis[0] + chassis[1] + chassis[2]).toBe(0);

    // Outside the rounded square: transparent.
    const corner = pixelAt(decoded, 2, 2);
    expect(corner[3]).toBe(0);
  });

  it('is maskable-safe: every green pixel sits inside the launcher safe zone', () => {
    // Launchers may crop maskable icons to the central 80% (radius 0.40
    // of the canvas). The green disc is the content that must survive.
    const decoded = decodePng(resolve(publicDir, 'icons/icon-512.png'));
    const center = decoded.width / 2;
    const safeRadius = 0.4 * decoded.width;

    let maxGreenRadius = 0;
    for (let y = 0; y < decoded.height; y++) {
      for (let x = 0; x < decoded.width; x++) {
        const [r, g, b, a] = pixelAt(decoded, x, y);
        if (a > 128 && g > 100 && g > r && g > b) {
          const dist = Math.hypot(x + 0.5 - center, y + 0.5 - center);
          if (dist > maxGreenRadius) maxGreenRadius = dist;
        }
      }
    }
    expect(maxGreenRadius).toBeGreaterThan(0);
    expect(maxGreenRadius).toBeLessThan(safeRadius);
  });
});

describe('offline shell', () => {
  it('ships a service worker at /sw.js', () => {
    const sw = readFileSync(resolve(publicDir, 'sw.js'), 'utf-8');
    expect(sw).toContain("addEventListener('fetch'");
    expect(sw).toContain("mode === 'navigate'");
  });

  it('registers the service worker on load', () => {
    const main = readFileSync(resolve(root, 'src/main.tsx'), 'utf-8');
    expect(main).toContain("navigator.serviceWorker.register('/sw.js')");
  });
});
