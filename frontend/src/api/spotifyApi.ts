import { apiClient } from "./client";
import type { NowPlaying, SpotifyArtist, SpotifyDevice, SpotifyTrack } from "../types/spotify";

export const spotifyApi = {
  topTracks: async (limit = 20): Promise<SpotifyTrack[]> => {
    const { data } = await apiClient.get<{ items: SpotifyTrack[] }>("/spotify/top-tracks", {
      params: { limit },
    });
    return data.items;
  },

  topArtists: async (limit = 20): Promise<SpotifyArtist[]> => {
    const { data } = await apiClient.get<{ items: SpotifyArtist[] }>("/spotify/top-artists", {
      params: { limit },
    });
    return data.items;
  },

  playbackToken: async (): Promise<{ access_token: string; expires_at: string }> => {
    const { data } = await apiClient.get("/spotify/playback-token");
    return data;
  },

  nowPlaying: async (): Promise<NowPlaying | null> => {
    const { data } = await apiClient.get<NowPlaying | Record<string, never>>("/spotify/now-playing");
    return "track" in data ? (data as NowPlaying) : null;
  },

  devices: async (): Promise<SpotifyDevice[]> => {
    const { data } = await apiClient.get<{ items: SpotifyDevice[] }>("/spotify/devices");
    return data.items;
  },

  play: (deviceId?: string, uris?: string[], contextUri?: string) =>
    apiClient.put("/spotify/playback/play", { device_id: deviceId, uris, context_uri: contextUri }),

  pause: (deviceId?: string) => apiClient.put("/spotify/playback/pause", { device_id: deviceId }),

  next: (deviceId?: string) => apiClient.post("/spotify/playback/next", { device_id: deviceId }),

  previous: (deviceId?: string) => apiClient.post("/spotify/playback/previous", { device_id: deviceId }),

  seek: (positionMs: number, deviceId?: string) =>
    apiClient.put("/spotify/playback/seek", { position_ms: positionMs, device_id: deviceId }),

  setVolume: (volumePercent: number, deviceId?: string) =>
    apiClient.put("/spotify/playback/volume", { volume_percent: volumePercent, device_id: deviceId }),

  transfer: (deviceId: string, play = true) => apiClient.put("/spotify/playback/transfer", { device_id: deviceId, play }),

  addToQueue: (uri: string, deviceId?: string) => apiClient.post("/spotify/playback/queue", { uri, device_id: deviceId }),

  savedTracksContains: async (ids: string[]): Promise<Record<string, boolean>> => {
    const { data } = await apiClient.get("/spotify/library/tracks/contains", { params: { ids: ids.join(",") } });
    return data;
  },

  saveTracks: (ids: string[]) => apiClient.put("/spotify/library/tracks", { ids }),

  unsaveTracks: (ids: string[]) => apiClient.delete("/spotify/library/tracks", { data: { ids } }),

  followingArtistsContains: async (ids: string[]): Promise<Record<string, boolean>> => {
    const { data } = await apiClient.get("/spotify/library/artists/following-contains", {
      params: { ids: ids.join(",") },
    });
    return data;
  },

  followArtists: (ids: string[]) => apiClient.put("/spotify/library/artists/follow", { ids }),

  unfollowArtists: (ids: string[]) => apiClient.delete("/spotify/library/artists/follow", { data: { ids } }),
};
