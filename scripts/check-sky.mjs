import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectSkySnapshot } from '../src/lib/sky-snapshot.ts';

const sky = JSON.parse(readFileSync(new URL('../src/data/sky.json', import.meta.url), 'utf8'));
const mars = sky.snaps.flatMap((snap, i) => snap.world === 'mars' ? [i] : []);
assert.ok(mars.length > 1, 'multiple real Mars viewpoints are available');
for (const previous of [null, '', 'junk', '-1', '1.5', '999999', ...sky.snaps.map((_, i) => String(i))]) {
  for (const random of [0, 0.25, 0.5, 0.999999]) {
    const index = selectSkySnapshot(sky.snaps, previous, () => random);
    assert.equal(sky.snaps[index].world, 'mars', 'observer always stands on Mars');
    assert.equal(sky.snaps[index].planet.name, 'Earth', 'Earth is seen from Mars');
    assert.notEqual(index, Number(previous ?? -1), 'successive loads never reuse the previous snapshot');
  }
}
assert.deepEqual(new Set(mars.map((_, i) => selectSkySnapshot(sky.snaps, null, () => (i + 0.5) / mars.length))), new Set(mars), 'all Mars viewpoints can be selected');
let previous = null;
for (let load = 0; load < 100; load++) {
  const index = selectSkySnapshot(sky.snaps, previous, () => 0);
  assert.notEqual(String(index), previous, 'even identical random draws advance the view');
  previous = String(index);
}
assert.throws(() => selectSkySnapshot([{ world: 'earth' }], null), /Mars/, 'no silent fallback to an Earth observer');
console.log(`Sky selection verified: ${mars.length} real Mars viewpoints, no consecutive repeats, invalid stored values handled.`);
