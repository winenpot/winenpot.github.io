/** Calendar-month positions are half-open: an end month occupies its full cell. */
export const month = (ym: string) => {
  const [year, m] = ym.split('-').map(Number);
  return year * 12 + m - 1;
};
export const monthString = (n: number) => `${Math.floor(n / 12)}-${String(n % 12 + 1).padStart(2, '0')}`;
export const axisX = (n: number, first: number, last: number) => 20 + (n - first) / (last - first) * 960;
const sineY = (x: number) => 50 + 30 * Math.sin((x / 1000) * Math.PI * 3.2 + 0.4);
export const waveY = (x: number) => {
  const left = Math.floor(x / 10) * 10;
  return sineY(left) + (sineY(left + 10) - sineY(left)) * (x - left) / 10;
};
export const baseWave = Array.from({ length: 101 }, (_, i) => `${i ? 'L' : 'M'}${i * 10} ${sineY(i * 10).toFixed(2)}`).join(' ');

/** Assign the first free lane in chronological order; month ends are inclusive. */
export function allocateLanes(spans: { start: string; end?: string }[], current: number) {
  const laneEnds: number[] = [];
  const lanes: number[] = Array(spans.length);
  const ordered = spans.map((span, index) => ({ span, index })).sort((a, b) => a.span.start.localeCompare(b.span.start) || a.index - b.index);
  for (const { span, index } of ordered) {
    const start = month(span.start);
    const end = Math.max(start, span.end ? month(span.end) : current);
    let lane = laneEnds.findIndex(previousEnd => previousEnd < start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = end;
    lanes[index] = lane;
  }
  // Prefer shorter concurrent tenures near the baseline when two complete
  // lanes can be swapped without introducing a conflict or adding a lane.
  const intervals = spans.map((span, index) => ({ index, start: month(span.start), end: Math.max(month(span.start), span.end ? month(span.end) : current) }));
  const overlaps = (a: typeof intervals[number], b: typeof intervals[number]) => a.start <= b.end && b.start <= a.end;
  for (const item of [...intervals].sort((a, b) => (a.end - a.start) - (b.end - b.start) || a.index - b.index)) {
    for (let target = 0; target < lanes[item.index]; target++) {
      const conflicts = intervals.filter(other => lanes[other.index] === target && overlaps(item, other));
      if (conflicts.length !== 1) continue;
      const other = conflicts[0];
      if (other.end - other.start <= item.end - item.start) continue;
      if (intervals.some(candidate => candidate.index !== item.index && lanes[candidate.index] === lanes[item.index] && overlaps(other, candidate))) continue;
      const old = lanes[item.index];
      lanes[item.index] = target;
      lanes[other.index] = old;
      break;
    }
  }
  return lanes;
}

export function ribbon(startMonth: string, endMonth: string | undefined, first: number, last: number, current: number, index: number) {
  const start = month(startMonth);
  const end = Math.max(start + 1, month(endMonth ?? monthString(current)) + 1);
  const startX = axisX(start, first, last), endX = axisX(end, first, last);
  // Use the same 10-unit samples as the original dotted polyline, including
  // interpolated endpoints so a clipped ribbon never drifts from its base.
  const xs = [startX];
  for (let x = Math.floor(startX / 10) * 10 + 10; x < endX; x += 10) xs.push(x);
  xs.push(endX);
  const offset = (4 + Math.floor(index / 2) * 7) * (index % 2 ? -1 : 1);
  const d = xs.map((x, p) => `${p ? 'L' : 'M'}${x.toFixed(2)} ${(waveY(x) + offset).toFixed(2)}`).join(' ');
  return { d, end: monthString(end), startX, endX, startY: waveY(startX) + offset, endY: waveY(endX) + offset };
}
