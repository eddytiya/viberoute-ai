import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, ListPlus, Play, Plus, Waypoints, X } from "lucide-react";

import { spotifyApi } from "../../api/spotifyApi";
import { usePlayerStore } from "../../store/playerStore";
import type { SpotifyTrack } from "../../types/spotify";
import { formatDurationMs } from "../../utils/duration";

export function TrackCard({
  track,
  index,
  onFindSimilar,
  onAdd,
  onRemove,
}: {
  track: SpotifyTrack;
  index?: number;
  onFindSimilar?: (track: SpotifyTrack) => void;
  onAdd?: (track: SpotifyTrack) => void;
  onRemove?: (track: SpotifyTrack) => void;
}) {
  const image = track.album.images.at(-1)?.url;
  const queryClient = useQueryClient();
  const deviceId = usePlayerStore((s) => s.deviceId);
  const sdkReady = usePlayerStore((s) => s.sdkReady);

  const playMutation = useMutation({
    mutationFn: () => spotifyApi.play(sdkReady ? (deviceId ?? undefined) : undefined, [`spotify:track:${track.id}`]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["now-playing"] }),
  });

  const savedQuery = useQuery({
    queryKey: ["saved-track", track.id],
    queryFn: async () => (await spotifyApi.savedTracksContains([track.id]))[track.id] ?? false,
  });

  const likeMutation = useMutation({
    mutationFn: () =>
      savedQuery.data ? spotifyApi.unsaveTracks([track.id]) : spotifyApi.saveTracks([track.id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-track", track.id] }),
  });

  const queueMutation = useMutation({
    mutationFn: () => spotifyApi.addToQueue(`spotify:track:${track.id}`),
  });

  return (
    <a
      href={track.external_urls.spotify}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-3) var(--space-3)",
        borderRadius: "var(--radius-md)",
        textDecoration: "none",
        color: "inherit",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {index !== undefined && (
        <span style={{ width: 20, textAlign: "right", fontSize: 13, color: "var(--text)" }}>{index + 1}</span>
      )}

      <button
        type="button"
        title={sdkReady ? "Play in VibeRoute" : "Connecting to the in-app player..."}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (sdkReady) playMutation.mutate();
        }}
        disabled={playMutation.isPending || !sdkReady}
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--surface)",
          border: "none",
          padding: 0,
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          const overlay = e.currentTarget.querySelector<HTMLElement>(".play-overlay");
          if (overlay) overlay.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          const overlay = e.currentTarget.querySelector<HTMLElement>(".play-overlay");
          if (overlay) overlay.style.opacity = "0";
        }}
      >
        {image && <img src={image} alt="" width={44} height={44} style={{ objectFit: "cover" }} />}
        <div
          className="play-overlay"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            color: "white",
            opacity: image ? 0 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          <Play size={16} fill="currentColor" />
        </div>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: "var(--text-h)",
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {track.name}
        </div>
        <div
          style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {track.artists.map((a) => a.name).join(", ")}
        </div>
      </div>

      <span style={{ fontSize: 13, flexShrink: 0 }}>{formatDurationMs(track.duration_ms)}</span>

      <button
        type="button"
        title={savedQuery.data ? "Remove from Liked Songs" : "Save to Liked Songs"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          likeMutation.mutate();
        }}
        disabled={likeMutation.isPending}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: savedQuery.data ? "var(--accent)" : "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <motion.span
          key={String(savedQuery.data)}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          style={{ display: "flex" }}
        >
          <Heart size={14} fill={savedQuery.data ? "currentColor" : "none"} />
        </motion.span>
      </button>

      <button
        type="button"
        title="Add to queue"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          queueMutation.mutate();
        }}
        disabled={queueMutation.isPending}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: queueMutation.isSuccess ? "var(--success)" : "var(--surface)",
          color: queueMutation.isSuccess ? "white" : "var(--text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <ListPlus size={14} />
      </button>

      {onFindSimilar && (
        <button
          type="button"
          title="Find similar tracks"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFindSimilar(track);
          }}
          style={{
            flexShrink: 0,
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
          <Waypoints size={14} />
        </button>
      )}

      {onAdd && (
        <button
          type="button"
          title="Add to this playlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAdd(track);
          }}
          style={{
            flexShrink: 0,
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
          <Plus size={14} />
        </button>
      )}

      {onRemove && (
        <button
          type="button"
          title="Remove from this playlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(track);
          }}
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      )}
    </a>
  );
}
