import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { soundMapApi } from "../../api/soundMapApi";
import { formatDurationMs } from "../../utils/duration";
import type { SpotifyTrack } from "../../types/spotify";
import { ErrorMessage } from "../common/ErrorMessage";
import { Loader } from "../common/Loader";

export function SimilarTracksPanel({ track, onClose }: { track: SpotifyTrack; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["similar", track.id],
    queryFn: () => soundMapApi.getSimilarTracks(track, 8),
  });

  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>More like this</h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {isLoading && <Loader label="Searching your local track corpus..." />}
      {isError && <ErrorMessage message="Could not find similar tracks." />}
      {data && data.length === 0 && <p style={{ fontSize: 14 }}>No similar tracks found yet.</p>}

      {data && data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {data.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-4)",
                padding: "var(--space-3)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--bg)",
                }}
              >
                {t.album_image_url && <img src={t.album_image_url} alt="" width={40} height={40} style={{ objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "var(--text-h)", fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontSize: 13 }}>{t.artists.map((a) => a.name).join(", ")}</div>
              </div>
              <span style={{ fontSize: 13 }}>{formatDurationMs(t.duration_ms)}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                }}
              >
                {Math.round(t.similarity_pct)}% similar
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
