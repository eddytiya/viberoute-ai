import { apiClient } from "./client";
import type { SavedPlaylist } from "../types/playlist";
import type { ListeningPatterns, SoundMapData } from "../types/soundmap";
import type { SpotifyTrack } from "../types/spotify";

export interface SimilarTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album_name: string | null;
  album_image_url: string | null;
  duration_ms: number;
  similarity_pct: number;
}

export const soundMapApi = {
  getSoundMap: async (): Promise<SoundMapData> => {
    const { data } = await apiClient.get<SoundMapData>("/insights/sound-map");
    return data;
  },

  saveCluster: async (cluster: number, label: string, trackIds: string[]): Promise<SavedPlaylist> => {
    const { data } = await apiClient.post<SavedPlaylist>("/insights/sound-map/save-cluster", {
      cluster,
      label,
      track_ids: trackIds,
    });
    return data;
  },

  getSimilarTracks: async (track: SpotifyTrack, limit = 8): Promise<SimilarTrack[]> => {
    const { data } = await apiClient.post<{ tracks: SimilarTrack[] }>(
      "/insights/similar",
      { track },
      { params: { limit } },
    );
    return data.tracks;
  },

  getListeningPatterns: async (): Promise<ListeningPatterns> => {
    const { data } = await apiClient.get<ListeningPatterns>("/insights/listening-patterns");
    return data;
  },
};
