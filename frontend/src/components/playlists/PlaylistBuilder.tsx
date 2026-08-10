import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { playlistApi } from "../../api/playlistApi";
import { recommendationApi } from "../../api/recommendationApi";
import { Button } from "../common/Button";
import { ErrorMessage } from "../common/ErrorMessage";
import { Loader } from "../common/Loader";
import { TrackList } from "../music/TrackList";
import type { PlaylistPreview } from "../../types/playlist";

export function PlaylistBuilder() {
  const [mood, setMood] = useState("");
  const [preview, setPreview] = useState<PlaylistPreview | null>(null);

  const previewMutation = useMutation({
    mutationFn: () => playlistApi.preview(mood),
    onSuccess: (data) => {
      setPreview(data);
      insightsMutation.mutate(data.tracks);
    },
  });

  const insightsMutation = useMutation({
    mutationFn: (tracks: PlaylistPreview["tracks"]) => recommendationApi.playlistInsights(tracks),
  });

  const popupRef = useRef<Window | null>(null);

  const saveMutation = useMutation({
    mutationFn: () => playlistApi.save(preview!.playlist_name, preview!.playlist_description, preview!.tracks),
    onSuccess: (data) => {
      if (data.spotify_url && popupRef.current && !popupRef.current.closed) {
        popupRef.current.location.href = data.spotify_url;
      } else if (data.spotify_url) {
        window.open(data.spotify_url, "_blank", "noopener,noreferrer");
      }
    },
    onError: () => {
      popupRef.current?.close();
    },
  });

  const triggerSave = () => {
    if (saveMutation.isPending || saveMutation.isSuccess) return;
    popupRef.current = window.open("about:blank", "_blank");
    saveMutation.mutate();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", maxWidth: 640 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (mood.trim().length >= 3) previewMutation.mutate();
        }}
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
      >
        <label htmlFor="mood" style={{ fontSize: 14, color: "var(--text-h)", fontWeight: 600 }}>
          Describe a mood, scene, or moment
        </label>
        <textarea
          id="mood"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="e.g. songs that feel like reading a sci-fi novel in a coffee shop"
          rows={3}
          style={{
            padding: "var(--space-3)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-h)",
            font: "inherit",
            resize: "vertical",
          }}
        />
        <Button type="submit" disabled={mood.trim().length < 3 || previewMutation.isPending}>
          {previewMutation.isPending ? "Building..." : "Build playlist"}
        </Button>
      </form>

      {previewMutation.isPending && <Loader label="Asking Gemini and searching Spotify..." />}
      {previewMutation.isError && (
        <ErrorMessage
          message={
            (previewMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            "Could not build a playlist. Try a different description."
          }
        />
      )}

      {preview && (
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
              {saveMutation.isPending ? "Saving to Spotify..." : preview.playlist_name}
            </h2>
            <p style={{ fontSize: 14 }}>{preview.playlist_description}</p>
          </div>

          {insightsMutation.isPending && <Loader label="Scoring diversity and novelty..." />}
          {insightsMutation.data && (
            <div style={{ display: "flex", gap: "var(--space-5)" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-h)" }}>
                  {insightsMutation.data.diversity_score}%
                </div>
                <div style={{ fontSize: 12 }}>diversity</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-h)" }}>
                  {insightsMutation.data.avg_novelty_score}%
                </div>
                <div style={{ fontSize: 12 }}>novelty vs your usual taste</div>
              </div>
            </div>
          )}

          <TrackList tracks={preview.tracks} />

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
            <Button
              variant="secondary"
              onClick={triggerSave}
              disabled={saveMutation.isPending}
              style={{ alignSelf: "flex-start" }}
            >
              {saveMutation.isPending ? "Saving..." : "Save to Spotify"}
            </Button>
          )}
          {saveMutation.isError && <ErrorMessage message="Could not save the playlist to Spotify." />}
        </section>
      )}
    </div>
  );
}
