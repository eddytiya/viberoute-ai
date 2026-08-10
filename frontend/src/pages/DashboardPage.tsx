import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ErrorMessage } from "../components/common/ErrorMessage";
import { FeatureTour } from "../components/dashboard/FeatureTour";
import { Loader } from "../components/common/Loader";
import { ArtistCard } from "../components/music/ArtistCard";
import { SimilarTracksPanel } from "../components/music/SimilarTracksPanel";
import { TrackList } from "../components/music/TrackList";
import { spotifyApi } from "../api/spotifyApi";
import { useAuth } from "../hooks/useAuth";
import type { SpotifyTrack } from "../types/spotify";

export function DashboardPage() {
  const { profile } = useAuth();
  const [similarTrack, setSimilarTrack] = useState<SpotifyTrack | null>(null);
  const {
    data: tracks,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["top-tracks"],
    queryFn: () => spotifyApi.topTracks(20),
  });

  const {
    data: artists,
    isLoading: artistsLoading,
    isError: artistsError,
  } = useQuery({
    queryKey: ["top-artists"],
    queryFn: () => spotifyApi.topArtists(12),
  });

  const isFirstTimeHere = tracks !== undefined && tracks.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <p>Welcome back, {profile?.display_name?.split(" ")[0]}. Here's what you've been playing.</p>

      {isFirstTimeHere && (
        <section
          style={{
            background: "var(--accent-bg)",
            border: "1px solid var(--accent-border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-4)",
          }}
        >
          <h2 style={{ marginBottom: "var(--space-2)" }}>New here — let's get started</h2>
          <p style={{ fontSize: 14 }}>
            Spotify hasn't built up your listening history yet, so your top tracks are empty for now. That's fine —
            everything below works from the start. Pick a feature to try:
          </p>
        </section>
      )}

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4)",
        }}
      >
        <h2 style={{ marginBottom: "var(--space-3)" }}>Your top tracks</h2>
        {isLoading && <Loader label="Loading your top tracks..." />}
        {isError && <ErrorMessage message="Could not load your top tracks. Try refreshing." />}
        {tracks && tracks.length > 0 && <TrackList tracks={tracks} onFindSimilar={setSimilarTrack} />}
        {isFirstTimeHere && (
          <p style={{ fontSize: 14 }}>Nothing here yet — keep listening on Spotify and this will fill in.</p>
        )}
      </section>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4)",
        }}
      >
        <h2 style={{ marginBottom: "var(--space-3)" }}>Your top artists</h2>
        {artistsLoading && <Loader label="Loading your top artists..." />}
        {artistsError && <ErrorMessage message="Could not load your top artists. Try refreshing." />}
        {artists && artists.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "var(--space-3)" }}>
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        )}
        {artists && artists.length === 0 && (
          <p style={{ fontSize: 14 }}>Nothing here yet — keep listening on Spotify and this will fill in.</p>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: "var(--space-3)" }}>Explore VibeRoute AI</h2>
        <FeatureTour />
      </section>

      {similarTrack && <SimilarTracksPanel track={similarTrack} onClose={() => setSimilarTrack(null)} />}
    </div>
  );
}
