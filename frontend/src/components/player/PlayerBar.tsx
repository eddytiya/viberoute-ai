import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Laptop2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { spotifyApi } from "../../api/spotifyApi";
import { usePlayerStore } from "../../store/playerStore";
import { getDominantColor } from "../../utils/dominantColor";
import { formatDurationMs } from "../../utils/duration";

export function PlayerBar() {
  const { sdkReady, deviceId } = usePlayerStore();
  const queryClient = useQueryClient();
  const [localPositionMs, setLocalPositionMs] = useState(0);
  const [localVolume, setLocalVolume] = useState<number | null>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  const { data: nowPlaying } = useQuery({
    queryKey: ["now-playing"],
    queryFn: spotifyApi.nowPlaying,
    refetchInterval: 4000,
  });

  useEffect(() => {
    setLocalPositionMs(nowPlaying?.progress_ms ?? 0);
  }, [nowPlaying?.progress_ms, nowPlaying?.track.id]);

  useEffect(() => {
    if (!nowPlaying?.is_playing) return;
    const id = setInterval(() => setLocalPositionMs((p) => p + 1000), 1000);
    return () => clearInterval(id);
  }, [nowPlaying?.is_playing]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["now-playing"] });

  const playPauseMutation = useMutation({
    mutationFn: async () => {
      if (nowPlaying?.is_playing) {
        await spotifyApi.pause();
      } else {
        await spotifyApi.play();
      }
    },
    onSuccess: invalidate,
  });

  const nextMutation = useMutation({ mutationFn: () => spotifyApi.next(), onSuccess: invalidate });
  const previousMutation = useMutation({ mutationFn: () => spotifyApi.previous(), onSuccess: invalidate });

  const transferMutation = useMutation({
    mutationFn: () => spotifyApi.transfer(deviceId!, true),
    onSuccess: invalidate,
  });

  const seekMutation = useMutation({
    mutationFn: (positionMs: number) => spotifyApi.seek(positionMs, sdkReady ? (deviceId ?? undefined) : undefined),
    onSuccess: invalidate,
  });

  const volumeMutation = useMutation({
    mutationFn: (volumePercent: number) =>
      spotifyApi.setVolume(volumePercent, sdkReady ? (deviceId ?? undefined) : undefined),
  });

  const image = nowPlaying?.track.album.images.at(-1)?.url;

  const { data: accentColor } = useQuery({
    queryKey: ["dominant-color", image],
    queryFn: () => getDominantColor(image!),
    enabled: !!image,
    staleTime: Infinity,
  });

  if (!nowPlaying) return null;

  const isThisDevice = sdkReady && nowPlaying.device_id === deviceId;
  const progressPct = Math.min(100, (localPositionMs / nowPlaying.track.duration_ms) * 100);
  const accent = accentColor ?? "var(--accent)";

  return (
    <div
      style={{
        height: "var(--player-bar-height, 72px)",
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "0 var(--space-5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", width: 220, flexShrink: 0 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            background: "var(--surface-hover)",
            flexShrink: 0,
            boxShadow: `0 0 16px -2px ${accent}`,
            transition: "box-shadow 0.6s ease",
          }}
        >
          {image && <img src={image} alt="" width={44} height={44} style={{ objectFit: "cover" }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-h)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {nowPlaying.track.name}
          </div>
          <div style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {nowPlaying.track.artists.map((a) => a.name).join(", ")}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <button type="button" onClick={() => previousMutation.mutate()} style={iconButtonStyle}>
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          onClick={() => playPauseMutation.mutate()}
          disabled={playPauseMutation.isPending}
          style={{
            ...iconButtonStyle,
            width: 36,
            height: 36,
            background: accent,
            color: "var(--accent-text)",
            transition: "background 0.6s ease",
          }}
        >
          {nowPlaying.is_playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button type="button" onClick={() => nextMutation.mutate()} style={iconButtonStyle}>
          <SkipForward size={16} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
        <span style={{ fontSize: 11, width: 36, textAlign: "right" }}>{formatDurationMs(localPositionMs)}</span>
        <div
          ref={progressTrackRef}
          onClick={(e) => {
            const track = progressTrackRef.current;
            if (!track) return;
            const rect = track.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            const positionMs = Math.round(ratio * nowPlaying.track.duration_ms);
            setLocalPositionMs(positionMs);
            seekMutation.mutate(positionMs);
          }}
          style={{
            flex: 1,
            height: 4,
            borderRadius: "var(--radius-pill)",
            background: "var(--border)",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              borderRadius: "var(--radius-pill)",
              background: accent,
              transition: "width 1s linear, background 0.6s ease",
            }}
          />
        </div>
        <span style={{ fontSize: 11, width: 36 }}>{formatDurationMs(nowPlaying.track.duration_ms)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", width: 100, flexShrink: 0 }}>
        {(() => {
          const vol = localVolume ?? nowPlaying.volume_percent ?? 50;
          const VolIcon = vol === 0 ? VolumeX : vol < 50 ? Volume1 : Volume2;
          return <VolIcon size={14} style={{ flexShrink: 0, color: "var(--text)" }} />;
        })()}
        <input
          type="range"
          min={0}
          max={100}
          value={localVolume ?? nowPlaying.volume_percent ?? 50}
          onChange={(e) => setLocalVolume(Number(e.target.value))}
          onMouseUp={(e) => volumeMutation.mutate(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => volumeMutation.mutate(Number((e.target as HTMLInputElement).value))}
          style={{ flex: 1, accentColor: accent }}
        />
      </div>

      <div style={{ flexShrink: 0, fontSize: 12, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Laptop2 size={14} />
        {nowPlaying.device_name}
        {sdkReady && !isThisDevice && (
          <button
            type="button"
            onClick={() => transferMutation.mutate()}
            disabled={transferMutation.isPending}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border)",
              background: "var(--surface-hover)",
              color: "var(--accent)",
              cursor: "pointer",
            }}
          >
            Play here
          </button>
        )}
      </div>
    </div>
  );
}

const iconButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-h)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};
