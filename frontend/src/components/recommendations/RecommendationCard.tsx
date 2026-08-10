import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ListPlus, Play, Plus, X } from "lucide-react";

import { recommendationApi } from "../../api/recommendationApi";
import { spotifyApi } from "../../api/spotifyApi";
import { usePlayerStore } from "../../store/playerStore";
import type { DiscoveredTrack } from "../../types/recommendation";
import { formatDurationMs } from "../../utils/duration";
import { matchColor } from "../../utils/vizColors";

const DISMISS_THRESHOLD = 110;

export function RecommendationCard({
  track,
  onDismissed,
}: {
  track: DiscoveredTrack;
  onDismissed: (trackId: string) => void;
}) {
  const image = track.album.images.at(-1)?.url;
  const queryClient = useQueryClient();
  const deviceId = usePlayerStore((s) => s.deviceId);
  const sdkReady = usePlayerStore((s) => s.sdkReady);

  const saveMutation = useMutation({
    mutationFn: () => recommendationApi.quickSave(track),
  });

  const dismissMutation = useMutation({
    mutationFn: () => recommendationApi.dismiss(track.id, track.artists[0]?.id),
    onSuccess: () => onDismissed(track.id),
  });

  const queueMutation = useMutation({
    mutationFn: () => spotifyApi.addToQueue(`spotify:track:${track.id}`),
  });

  const playMutation = useMutation({
    mutationFn: () => spotifyApi.play(sdkReady ? (deviceId ?? undefined) : undefined, [`spotify:track:${track.id}`]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["now-playing"] }),
  });

  const dragX = useMotionValue(0);
  const cardOpacity = useTransform(dragX, [-200, 0, 200], [0.3, 1, 0.3]);
  const dismissTint = useTransform(dragX, [-DISMISS_THRESHOLD, 0, DISMISS_THRESHOLD], [
    "rgba(229, 72, 77, 0.12)",
    "rgba(0, 0, 0, 0)",
    "rgba(61, 214, 140, 0.12)",
  ]);

  const mColor = matchColor(track.match_pct);

  return (
    <motion.div
      layout
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      whileHover={{ backgroundColor: "var(--surface-hover)" }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > DISMISS_THRESHOLD) dismissMutation.mutate();
      }}
      style={{
        x: dragX,
        opacity: cardOpacity,
        background: dismissTint,
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-md)",
        cursor: "grab",
      }}
      whileDrag={{ cursor: "grabbing" }}
    >
      <button
        type="button"
        title={sdkReady ? "Play in VibeRoute" : "Connecting to the in-app player..."}
        onClick={() => sdkReady && playMutation.mutate()}
        disabled={playMutation.isPending || !sdkReady}
        style={{
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          background: "var(--surface)",
          border: "none",
          padding: 0,
          cursor: "pointer",
          position: "relative",
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
        <a
          href={track.external_urls.spotify}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            color: "var(--text-h)",
            fontSize: 14,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: "none",
          }}
        >
          {track.name}
        </a>
        <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {track.artists.map((a) => a.name).join(", ")}
        </div>
        {track.reason && (
          <div style={{ fontSize: 12, fontStyle: "italic", marginTop: 2, color: "var(--accent)" }}>
            {track.reason}
          </div>
        )}
      </div>

      <span style={{ fontSize: 13, flexShrink: 0 }}>{formatDurationMs(track.duration_ms)}</span>

      <span
        style={{
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          background: `color-mix(in srgb, ${mColor} 18%, transparent)`,
          color: mColor,
        }}
      >
        {Math.round(track.match_pct)}% match
      </span>

      <button
        type="button"
        title={saveMutation.isSuccess ? "Saved" : "Quick-save to VibeRoute Discoveries"}
        onClick={() => !saveMutation.isSuccess && saveMutation.mutate()}
        disabled={saveMutation.isPending}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: saveMutation.isSuccess ? "var(--success)" : "var(--surface)",
          color: saveMutation.isSuccess ? "white" : "var(--text-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: saveMutation.isSuccess ? "default" : "pointer",
        }}
      >
        {saveMutation.isSuccess ? <Check size={14} /> : <Plus size={14} />}
      </button>

      <button
        type="button"
        title="Add to queue"
        onClick={() => queueMutation.mutate()}
        disabled={queueMutation.isPending}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: queueMutation.isSuccess ? "var(--success)" : "var(--surface)",
          color: queueMutation.isSuccess ? "white" : "var(--text-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <ListPlus size={14} />
      </button>

      <button
        type="button"
        title="Not for me"
        onClick={() => dismissMutation.mutate()}
        disabled={dismissMutation.isPending}
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
        <X size={14} />
      </button>
    </motion.div>
  );
}
