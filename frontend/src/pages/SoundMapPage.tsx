import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import { soundMapApi } from "../api/soundMapApi";
import type { ClusterSummary, SoundMapPoint } from "../types/soundmap";

const PALETTE = [
  "#c084fc",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#f472b6",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SoundMapPoint }[] }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-2) var(--space-3)",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--text-h)", fontWeight: 600 }}>{point.name}</div>
      <div>{point.artists.join(", ")}</div>
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: ClusterSummary }) {
  const popupRef = useRef<Window | null>(null);
  const saveMutation = useMutation({
    mutationFn: () => soundMapApi.saveCluster(cluster.cluster, cluster.label, cluster.track_ids),
    onSuccess: (data) => {
      if (data.spotify_url && popupRef.current && !popupRef.current.closed) {
        popupRef.current.location.href = data.spotify_url;
      } else if (data.spotify_url) {
        window.open(data.spotify_url, "_blank", "noopener,noreferrer");
      }
    },
    onError: () => popupRef.current?.close(),
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: PALETTE[cluster.cluster % PALETTE.length],
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "var(--text-h)", fontSize: 14, fontWeight: 500 }}>{cluster.label}</div>
          <div style={{ fontSize: 12 }}>{cluster.track_count} tracks</div>
        </div>
      </div>

      {saveMutation.isSuccess ? (
        <a href={saveMutation.data.spotify_url ?? "#"} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, flexShrink: 0 }}>
          Open playlist
        </a>
      ) : (
        <button
          type="button"
          onClick={() => {
            popupRef.current = window.open("about:blank", "_blank");
            saveMutation.mutate();
          }}
          disabled={saveMutation.isPending}
          style={{
            flexShrink: 0,
            fontSize: 12,
            padding: "6px 12px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-h)",
            cursor: "pointer",
          }}
        >
          {saveMutation.isPending ? "Saving..." : "Save as playlist"}
        </button>
      )}
    </div>
  );
}

export function SoundMapPage() {
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const { data, isLoading, isError } = useQuery({ queryKey: ["sound-map"], queryFn: soundMapApi.getSoundMap });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <p>
        Every track we've seen from you, projected into 2D and clustered by sound — points close together sound
        similar. Hover a cluster below to highlight it.
      </p>

      {isLoading && <Loader label="Projecting your library into sound-space..." />}
      {isError && <ErrorMessage message="Could not build the sound map." />}
      {data && data.points.length === 0 && (
        <p style={{ fontSize: 14 }}>Not enough tracks with embeddings yet — use Playlist Architect or Recommendations first.</p>
      )}

      {data && data.points.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
          <section
            style={{
              flex: "2 1 480px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-4)",
              height: 480,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid stroke="var(--border)" />
                <XAxis dataKey="x" type="number" tick={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis dataKey="y" type="number" tick={false} axisLine={{ stroke: "var(--border)" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                {data.clusters.map((c) => (
                  <Scatter
                    key={c.cluster}
                    data={data.points.filter((p) => p.cluster === c.cluster)}
                    fill={PALETTE[c.cluster % PALETTE.length]}
                    opacity={hoveredCluster === null || hoveredCluster === c.cluster ? 0.85 : 0.15}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </section>

          <section style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {data.clusters.map((c) => (
              <div
                key={c.cluster}
                onMouseEnter={() => setHoveredCluster(c.cluster)}
                onMouseLeave={() => setHoveredCluster(null)}
              >
                <ClusterCard cluster={c} />
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
