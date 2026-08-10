import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Camera, Check, Plus } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import { recommendationApi } from "../api/recommendationApi";
import { soundMapApi } from "../api/soundMapApi";
import { useArtistFollow } from "../hooks/useArtistFollow";
import { useAuth } from "../hooks/useAuth";
import type { ArtistRef } from "../types/prediction";
import { categoryColor } from "../utils/vizColors";
import { downloadCanvasAsPng, renderTasteFingerprintCard } from "../utils/tasteFingerprintCard";

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function GenreBar({ genre, pct }: { genre: string; pct: number }) {
  const color = categoryColor(genre);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-h)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
          {genre}
        </span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: "var(--radius-pill)", background: "var(--border)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: "100%",
            borderRadius: "var(--radius-pill)",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function ArtistTag({ artist, tone }: { artist: ArtistRef; tone: string }) {
  const { isFollowing, isPending, toggle } = useArtistFollow(artist.id);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        padding: "4px 6px 4px 10px",
        borderRadius: "var(--radius-pill)",
        background: tone,
        color: "var(--text-h)",
      }}
    >
      {artist.name}
      <button
        type="button"
        title={isFollowing ? "Unfollow" : "Follow"}
        onClick={toggle}
        disabled={isPending}
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "none",
          background: isFollowing ? "var(--success)" : "var(--surface)",
          color: isFollowing ? "white" : "var(--text-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {isFollowing ? <Check size={11} /> : <Plus size={11} />}
      </button>
    </span>
  );
}

function ArtistTagList({ title, artists, tone }: { title: string; artists: ArtistRef[]; tone: string }) {
  return (
    <div>
      <h3 style={{ marginBottom: "var(--space-2)" }}>{title}</h3>
      {artists.length === 0 ? (
        <p style={{ fontSize: 13 }}>None</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {artists.map((artist) => (
            <ArtistTag key={artist.id} artist={artist} tone={tone} />
          ))}
        </div>
      )}
    </div>
  );
}

async function shareOrDownloadCard(canvas: HTMLCanvasElement, filename: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;

  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: "My VibeRoute AI Taste Fingerprint" });
      return;
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }
  downloadCanvasAsPng(canvas, filename);
}

export function TasteInsightsPage() {
  const { profile } = useAuth();
  const fingerprint = useQuery({ queryKey: ["taste-fingerprint"], queryFn: recommendationApi.tasteFingerprint });
  const drift = useQuery({ queryKey: ["taste-drift"], queryFn: recommendationApi.tasteDrift });
  const patterns = useQuery({ queryKey: ["listening-patterns"], queryFn: soundMapApi.getListeningPatterns });

  const shareCardMutation = useMutation({
    mutationFn: async () => {
      if (!fingerprint.data) return;
      const canvas = renderTasteFingerprintCard({
        displayName: profile?.display_name ?? "My",
        summary: fingerprint.data.summary,
        topGenres: fingerprint.data.top_genres,
      });
      await shareOrDownloadCard(canvas, "vibe-route-taste-fingerprint.png");
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: 720 }}>
      <p>An AI-generated read on your taste, built from your own listening data.</p>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2>Taste Fingerprint</h2>
          {fingerprint.data && (
            <button
              type="button"
              onClick={() => shareCardMutation.mutate()}
              disabled={shareCardMutation.isPending}
              title="Share as an image"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border)",
                background: "var(--surface-hover)",
                color: "var(--accent)",
                cursor: "pointer",
              }}
            >
              <Camera size={13} />
              {shareCardMutation.isPending ? "Rendering..." : "Share card"}
            </button>
          )}
        </div>
        {fingerprint.isLoading && <Loader label="Analyzing your top artists..." />}
        {fingerprint.isError && (
          <ErrorMessage
            message={
              (fingerprint.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
              "Could not build your taste fingerprint."
            }
          />
        )}
        {fingerprint.data && (
          <>
            <p style={{ fontStyle: "italic" }}>{fingerprint.data.summary}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {fingerprint.data.top_genres.map((g) => (
                <GenreBar key={g.genre} genre={g.genre} pct={g.pct} />
              ))}
            </div>
          </>
        )}
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <h2>Taste Drift</h2>
        {drift.isLoading && <Loader label="Comparing recent vs long-term favorites..." />}
        {drift.isError && <ErrorMessage message="Could not compute taste drift." />}
        {drift.data && (
          <>
            <p style={{ fontSize: 13 }}>
              {drift.data.overlap_short_vs_long_pct}% of your recent top artists are also long-term favorites.
            </p>
            <ArtistTagList title="Steady favorites" artists={drift.data.steady_favorites} tone="var(--accent-bg)" />
            <ArtistTagList
              title="New favorites (last 4 weeks)"
              artists={drift.data.new_favorites}
              tone="color-mix(in srgb, var(--success) 15%, transparent)"
            />
            <ArtistTagList
              title="Fading favorites"
              artists={drift.data.fading_favorites}
              tone="color-mix(in srgb, var(--danger) 12%, transparent)"
            />
          </>
        )}
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <h2>Listening Patterns</h2>
        {patterns.isLoading && <Loader label="Aggregating your listening history..." />}
        {patterns.isError && <ErrorMessage message="Could not load listening patterns." />}
        {patterns.data && patterns.data.by_hour.every((h) => h.count === 0) && (
          <p style={{ fontSize: 14 }}>
            Not enough synced listening history yet — use "Sync history now" on the Skip Predictor page.
          </p>
        )}
        {patterns.data && patterns.data.by_hour.some((h) => h.count > 0) && (
          <>
            <div>
              <h3 style={{ marginBottom: "var(--space-2)" }}>By hour of day</h3>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patterns.data.by_hour}>
                    <XAxis
                      dataKey="hour"
                      tickFormatter={formatHour}
                      tick={{ fontSize: 11, fill: "var(--text)" }}
                      interval={2}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      labelFormatter={(h) => formatHour(Number(h))}
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: "var(--space-2)" }}>By day of week</h3>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patterns.data.by_day}>
                    <XAxis
                      dataKey="day"
                      tickFormatter={(d: string) => d.slice(0, 3)}
                      tick={{ fontSize: 11, fill: "var(--text)" }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", fontSize: 12 }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
