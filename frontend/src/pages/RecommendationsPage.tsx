import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListMusic, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../components/common/Button";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import { RecommendationGrid } from "../components/recommendations/RecommendationGrid";
import { playlistApi } from "../api/playlistApi";
import { recommendationApi } from "../api/recommendationApi";
import type { DiscoveredTrack, DiscoveryLevel } from "../types/recommendation";

const LEVELS: { value: DiscoveryLevel; label: string }[] = [
  { value: "safe", label: "Safe" },
  { value: "balanced", label: "Balanced" },
  { value: "adventurous", label: "Adventurous" },
];

export function RecommendationsPage() {
  const [level, setLevel] = useState<DiscoveryLevel>("balanced");
  const [tracks, setTracks] = useState<DiscoveredTrack[]>([]);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["discover", level],
    queryFn: () => recommendationApi.discover(level),
  });

  useEffect(() => {
    if (data) setTracks(data);
  }, [data]);

  const handleDismissed = (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  };

  const saveRoundMutation = useMutation({
    mutationFn: () =>
      playlistApi.save(
        `Discover — ${new Date().toLocaleDateString()}`,
        `A batch of ${tracks.length} tracks discovered on VibeRoute AI (${level} mode).`,
        tracks,
      ),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: 760 }}>
      <p>
        New tracks picked for you — Gemini explores genres adjacent to your taste, ranked by how closely each
        one matches what you actually listen to.
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {LEVELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setLevel(value);
                queryClient.removeQueries({ queryKey: ["discover", value] });
              }}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-pill)",
                border: `1px solid ${level === value ? "var(--accent)" : "var(--border)"}`,
                background: level === value ? "var(--accent-bg)" : "var(--surface)",
                color: level === value ? "var(--accent)" : "var(--text)",
                fontSize: 13,
                fontWeight: level === value ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {tracks.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => saveRoundMutation.mutate()}
              disabled={saveRoundMutation.isPending || saveRoundMutation.isSuccess}
            >
              <ListMusic size={14} />
              {saveRoundMutation.isSuccess ? "Saved as playlist" : "Save round as playlist"}
            </Button>
          )}
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} />
            {isFetching ? "Finding..." : "Find more"}
          </Button>
        </div>
      </div>

      {isLoading && <Loader label="Exploring adjacent genres and ranking matches..." />}
      {isError && (
        <ErrorMessage
          message={
            (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "Could not load recommendations. Try again."
          }
        />
      )}
      {saveRoundMutation.isError && <ErrorMessage message="Could not save this round as a playlist." />}
      {!isLoading && tracks.length === 0 && (
        <p style={{ fontSize: 14 }}>No tracks left this round — try "Find more" or a different level.</p>
      )}

      {tracks.length > 0 && (
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
          }}
        >
          <RecommendationGrid tracks={tracks} onDismissed={handleDismissed} />
        </section>
      )}
    </div>
  );
}
