import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";

import { playlistApi } from "../api/playlistApi";
import { routeApi } from "../api/routeApi";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import { TrackList } from "../components/music/TrackList";
import { RouteForm } from "../components/routes/RouteForm";
import { RouteSummary } from "../components/routes/RouteSummary";
import type { RoutePlaylistPreview, TravelMode } from "../types/route";

const ROUTE_PLAYLIST_SOURCE = "route_playlist";

export function RoutePlaylistPage() {
  const popupRef = useRef<Window | null>(null);
  const queryClient = useQueryClient();
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: ({ mood, origin, destination, mode }: { mood: string; origin: string; destination: string; mode: TravelMode }) =>
      routeApi.preview(mood, origin, destination, mode),
  });

  const historyQuery = useQuery({
    queryKey: ["playlist-history", ROUTE_PLAYLIST_SOURCE],
    queryFn: () => playlistApi.history(ROUTE_PLAYLIST_SOURCE),
  });

  const saveMutation = useMutation({
    mutationFn: (preview: RoutePlaylistPreview) =>
      playlistApi.save(preview.playlist_name, preview.playlist_description, preview.tracks, ROUTE_PLAYLIST_SOURCE),
    onSuccess: (data) => {
      if (data.spotify_url && popupRef.current && !popupRef.current.closed) {
        popupRef.current.location.href = data.spotify_url;
      } else if (data.spotify_url) {
        window.open(data.spotify_url, "_blank", "noopener,noreferrer");
      }
      queryClient.invalidateQueries({ queryKey: ["playlist-history", ROUTE_PLAYLIST_SOURCE] });
    },
    onError: () => popupRef.current?.close(),
  });

  const triggerSave = () => {
    if (!previewMutation.data || saveMutation.isPending || saveMutation.isSuccess) return;
    popupRef.current = window.open("about:blank", "_blank");
    saveMutation.mutate(previewMutation.data);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <p>Give us a route and a mood, and we'll build a playlist timed to end right as you arrive.</p>

      <RouteForm
        onSubmit={(mood, origin, destination, mode) => previewMutation.mutate({ mood, origin, destination, mode })}
        disabled={previewMutation.isPending}
      />

      {previewMutation.isPending && <Loader label="Calculating your route and matching tracks to the duration..." />}
      {previewMutation.isError && (
        <ErrorMessage
          message={
            (previewMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "Could not build a route playlist. Check your addresses and try again."
          }
        />
      )}

      {previewMutation.data && (
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
            maxWidth: 680,
          }}
        >
          <div>
            <h2
              onClick={triggerSave}
              title={saveMutation.isSuccess ? undefined : "Click to save this playlist to Spotify"}
              style={{
                cursor: saveMutation.isSuccess ? "default" : "pointer",
                textDecoration: saveMutation.isSuccess ? "none" : "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: "var(--border)",
                width: "fit-content",
              }}
            >
              {saveMutation.isPending ? "Saving to Spotify..." : previewMutation.data.playlist_name}
            </h2>
            <p style={{ fontSize: 14 }}>{previewMutation.data.playlist_description}</p>
          </div>

          <RouteSummary
            route={previewMutation.data.route}
            targetDurationMs={previewMutation.data.target_duration_ms}
            totalDurationMs={previewMutation.data.total_duration_ms}
          />

          <TrackList tracks={previewMutation.data.tracks} />

          {saveMutation.isSuccess ? (
            <a
              href={saveMutation.data.spotify_url ?? "#"}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--success)", fontSize: 14, fontWeight: 600 }}
            >
              Saved to Spotify — open playlist
            </a>
          ) : (
            <button
              type="button"
              onClick={triggerSave}
              disabled={saveMutation.isPending}
              style={{
                alignSelf: "flex-start",
                padding: "var(--space-3) var(--space-5)",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-h)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {saveMutation.isPending ? "Saving..." : "Save to Spotify"}
            </button>
          )}
          {saveMutation.isError && <ErrorMessage message="Could not save the playlist to Spotify." />}
        </section>
      )}

      <section>
        <h2 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <History size={18} />
          Past route playlists
        </h2>

        {historyQuery.isLoading && <Loader label="Loading history..." />}
        {historyQuery.isError && <ErrorMessage message="Could not load your route playlist history." />}
        {historyQuery.data && historyQuery.data.length === 0 && (
          <p style={{ fontSize: 14 }}>No saved route playlists yet — build one above and save it to Spotify.</p>
        )}

        {historyQuery.data && historyQuery.data.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxWidth: 680 }}>
            {historyQuery.data.map((item) => {
              const isExpanded = expandedHistoryId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      width: "100%",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--text-h)", fontSize: 15, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 13 }}>
                        {item.tracks.length} tracks · {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {item.spotify_url && (
                      <a
                        href={item.spotify_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}
                      >
                        Open in Spotify
                      </a>
                    )}
                  </button>

                  {item.description && (
                    <p style={{ fontSize: 13, marginTop: "var(--space-2)" }}>{item.description}</p>
                  )}

                  {isExpanded && (
                    <div style={{ marginTop: "var(--space-3)" }}>
                      <TrackList tracks={item.tracks} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
