import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
for (const [page, photo] of [
  ['index.html', 'photo_2026-11-26_10-34-51'],
  ['about/index.html', 'photo_2026-11-26_10-35-37'],
]) {
  const html = readFileSync(resolve(dist, page), 'utf8');
  const frame = html.match(/<figure\b[^>]*data-arch[^>]*>([\s\S]*?)<\/figure>/)?.[1];
  assert.ok(frame, `${page}: photo frame exists`);
  const images = [...frame.matchAll(/<img\b[^>]*>/g)].map(([img]) => img);
  assert.equal(images.length, 2, `${page}: greyscale and color photo layers replace the placeholder`);
  for (const image of images) {
    const src = image.match(/\bsrc="([^"]+)"/)?.[1];
    assert.ok(src?.includes(photo), `${page}: correct photo is used`);
    assert.ok(existsSync(resolve(dist, src.replace(/^\//, ''))), `${page}: photo is included in the build`);
  }
  assert.ok(images[0].match(/\balt="[^"]+"/), `${page}: portrait has alternative text`);
  assert.ok(images[1].includes('aria-hidden="true"'), `${page}: duplicate color layer is decorative`);
  console.log(`${page}: both photo layers and bundled asset verified`);
}
