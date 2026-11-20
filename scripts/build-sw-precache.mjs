/**
 * Emits dist/sw-precache.json — the list of same-origin shell URLs the
 * service worker precaches at install (hashed assets, icons, manifest).
 * Runs after `vite build`; the service worker reads it at runtime.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');

const html = readFileSync(resolve(dist, 'index.html'), 'utf-8');

const urls = new Set(['/index.html', '/manifest.webmanifest']);

// Asset references emitted by Vite: <script type="module" src="/assets/…">
// and <link rel="stylesheet" href="/assets/…">, plus preload links.
for (const match of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
  urls.add(match[1]);
}

// Icons referenced by the manifest and the HTML head.
for (const match of html.matchAll(/(?:content|href)="(\/icons\/[^"]+)"/g)) {
  urls.add(match[1]);
}
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.webmanifest'), 'utf-8'));
for (const icon of manifest.icons) {
  urls.add(icon.src);
}

writeFileSync(resolve(dist, 'sw-precache.json'), JSON.stringify([...urls], null, 2));
console.log(`wrote dist/sw-precache.json (${urls.size} URLs)`);
