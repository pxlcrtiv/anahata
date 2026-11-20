import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

const root = process.cwd();
const publicDir = resolve(root, 'public');
const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf-8');

/** Parses a PNG's IHDR chunk and returns { width, height }. */
function pngDimensions(buffer: Buffer): { width: number; height: number } {
  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    expect(buffer[i]).toBe(PNG_SIGNATURE[i]);
  }
  // IHDR is always the first chunk: length(4) + 'IHDR' + width(4) + height(4)
  expect(buffer.slice(12, 16).toString('ascii')).toBe('IHDR');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
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
    expect(manifest.start_url).toBe('/');
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
      const { width, height } = pngDimensions(readFileSync(path));
      expect(`${width}x${height}`).toBe(icon.sizes);
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
  /** Decodes a filter-0 RGBA PNG and samples one pixel. */
  function readPixel(path: string, x: number, y: number): [number, number, number, number] {
    const buffer = readFileSync(path);
    // Walk chunks to IDAT.
    let offset = 8;
    let idat: Buffer | null = null;
    let width = 0;
    while (offset < buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
      if (type === 'IHDR') width = buffer.readUInt32BE(offset + 8);
      if (type === 'IDAT') {
        idat = idat
          ? Buffer.concat([idat, buffer.slice(offset + 8, offset + 8 + length)])
          : buffer.slice(offset + 8, offset + 8 + length);
      }
      offset += 12 + length;
      if (type === 'IEND') break;
    }
    const raw = inflateSync(idat!);
    const stride = width * 4 + 1;
    const p = y * stride + 1 + x * 4;
    return [raw[p], raw[p + 1], raw[p + 2], raw[p + 3]];
  }

  it('renders the green play disc, dark glyph, and transparent corners', () => {
    const path = resolve(publicDir, 'icons/icon-512.png');

    // A point on the disc, clear of the glyph: (0.5, 0.25) normalized.
    const [r, g, b, a] = readPixel(path, 256, 128);
    expect(a).toBe(255);
    expect(r).toBe(0x22);
    expect(g).toBe(0xc5);
    expect(b).toBe(0x5e);

    // The glyph center: (0.5, 0.5) normalized.
    const glyph = readPixel(path, 256, 256);
    expect(glyph[3]).toBe(255);
    expect(glyph[0] + glyph[1] + glyph[2]).toBe(0);

    // The chassis: black, opaque, on the rounded square.
    const chassis = readPixel(path, 20, 256);
    expect(chassis[3]).toBe(255);
    expect(chassis[0] + chassis[1] + chassis[2]).toBe(0);

    // Outside the rounded square: transparent.
    const corner = readPixel(path, 2, 2);
    expect(corner[3]).toBe(0);
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
