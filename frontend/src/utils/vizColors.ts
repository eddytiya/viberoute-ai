/** Red -> amber -> green, interpolated by score (0-100). Mirrors the app's --danger/--success tokens. */
export function matchColor(pct: number): string {
  const stops: { at: number; rgb: [number, number, number] }[] = [
    { at: 0, rgb: [229, 72, 77] },
    { at: 50, rgb: [245, 166, 35] },
    { at: 100, rgb: [61, 214, 140] },
  ];
  const clamped = Math.max(0, Math.min(100, pct));
  const upperIndex = stops.findIndex((s) => s.at >= clamped);
  const upper = stops[Math.max(upperIndex, 1)];
  const lower = stops[Math.max(upperIndex, 1) - 1];
  const span = upper.at - lower.at || 1;
  const t = (clamped - lower.at) / span;
  const rgb = lower.rgb.map((c, i) => Math.round(c + (upper.rgb[i] - c) * t));
  return `rgb(${rgb.join(", ")})`;
}

/** Deterministic hue per label, so the same genre always gets the same color across renders/sessions. */
export function categoryColor(label: string, opacity = 1): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 58%, ${opacity})`;
}
