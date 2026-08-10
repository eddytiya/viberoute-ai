import { apiClient } from "./client";
import type { PlaylistInsights, TasteDrift, TasteFingerprint } from "../types/prediction";
import type { DiscoveredTrack, DiscoveryLevel } from "../types/recommendation";
import type { SpotifyTrack } from "../types/spotify";

export const recommendationApi = {
  tasteDrift: async (): Promise<TasteDrift> => {
    const { data } = await apiClient.get<TasteDrift>("/insights/drift");
    return data;
  },

  tasteFingerprint: async (): Promise<TasteFingerprint> => {
    const { data } = await apiClient.get<TasteFingerprint>("/insights/fingerprint");
    return data;
  },

  aiQuota: async (): Promise<{ used: number; limit: number; remaining: number }> => {
    const { data } = await apiClient.get("/insights/ai-quota");
    return data;
  },

  playlistInsights: async (tracks: SpotifyTrack[]): Promise<PlaylistInsights> => {
    const { data } = await apiClient.post<PlaylistInsights>("/recommendations/playlist-insights", { tracks });
    return data;
  },

  discover: async (level: DiscoveryLevel): Promise<DiscoveredTrack[]> => {
    const { data } = await apiClient.get<{ tracks: DiscoveredTrack[] }>("/recommendations/discover", {
      params: { level },
    });
    return data.tracks;
  },

  dismiss: async (trackId: string, artistId?: string): Promise<void> => {
    await apiClient.post("/recommendations/discover/dismiss", { track_id: trackId, artist_id: artistId });
  },

  quickSave: async (track: DiscoveredTrack): Promise<{ spotify_url: string }> => {
    const { data } = await apiClient.post<{ spotify_url: string }>("/recommendations/discover/quick-save", {
      track,
    });
    return data;
  },
};
