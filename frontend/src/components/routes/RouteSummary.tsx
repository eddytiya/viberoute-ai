import { Clock, MapPin, Music } from "lucide-react";

import type { RouteSummaryData } from "../../types/route";

function formatMs(ms: number): string {
  const minutes = Math.round(ms / 60000);
  return `${minutes} min`;
}

export function RouteSummary({
  route,
  targetDurationMs,
  totalDurationMs,
}: {
  route: RouteSummaryData;
  targetDurationMs: number;
  totalDurationMs: number;
}) {
  const diffMs = totalDurationMs - targetDurationMs;
  const diffLabel =
    Math.abs(diffMs) < 30000
      ? "matches your trip almost exactly"
      : diffMs > 0
        ? `${formatMs(diffMs)} longer than your trip`
        : `${formatMs(-diffMs)} shorter than your trip`;

  return (
    <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Clock size={16} color="var(--accent)" />
        <span style={{ fontSize: 14 }}>{route.duration_text} trip</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <MapPin size={16} color="var(--accent)" />
        <span style={{ fontSize: 14 }}>{route.distance_text}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Music size={16} color="var(--accent)" />
        <span style={{ fontSize: 14 }}>
          Playlist is {formatMs(totalDurationMs)} — {diffLabel}
        </span>
      </div>
    </div>
  );
}
