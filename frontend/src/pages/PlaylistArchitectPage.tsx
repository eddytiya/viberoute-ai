import { PlaylistBuilder } from "../components/playlists/PlaylistBuilder";

export function PlaylistArchitectPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <p>Describe a mood and Gemini will translate it into a real Spotify playlist.</p>
      <PlaylistBuilder />
    </div>
  );
}
