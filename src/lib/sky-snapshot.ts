type Snapshot = { world: string };

export function selectSkySnapshot(
  snapshots: readonly Snapshot[],
  previous: string | null,
  random: () => number = Math.random,
): number {
  // Randomly choose a real observer frame, never randomize individual stars.
  const mars = snapshots.flatMap((snap, index) => snap.world === 'mars' ? [index] : []);
  if (!mars.length) throw new Error('No Mars sky snapshots available');
  const last = previous?.trim() ? Number(previous) : -1;
  const candidates = mars.filter((index) => index !== last);
  const pool = candidates.length ? candidates : mars;
  return pool[Math.floor(random() * pool.length)];
}
