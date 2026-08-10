import { apiClient } from "./client";
import type { PlaylistHistoryItem, PlaylistPreview, SavedPlaylist, UserPlaylist } from "../types/playlist";
import type { SpotifyTrack } from "../types/spotify";

export const playlistApi = {
  preview: async (mood: string): Promise<PlaylistPreview> => {
    const { data } = await apiClient.post<PlaylistPreview>("/playlists/architect/preview", { mood });
    return data;
  },

  save: async (
    playlistName: string,
    playlistDescription: string,
    tracks: SpotifyTrack[],
    source: string = "playlist_architect",
  ): Promise<SavedPlaylist> => {
    const { data } = await apiClient.post<SavedPlaylist>("/playlists/architect/save", {
      playlist_name: playlistName,
      playlist_description: playlistDescription,
      tracks,
      source,
    });
    return data;
  },

  history: async (source: string): Promise<PlaylistHistoryItem[]> => {
    const { data } = await apiClient.get<{ items: PlaylistHistoryItem[] }>("/playlists/history", {
      params: { source },
    });
    return data.items;
  },

  search: async (q: string, limit = 20): Promise<SpotifyTrack[]> => {
    const { data } = await apiClient.get<{ tracks: SpotifyTrack[] }>("/playlists/search", { params: { q, limit } });
    return data.tracks;
  },

  mine: async (): Promise<UserPlaylist[]> => {
    const { data } = await apiClient.get<{ items: UserPlaylist[] }>("/playlists/mine");
    return data.items;
  },

  items: async (playlistId: string): Promise<SpotifyTrack[]> => {
    const { data } = await apiClient.get<{ tracks: SpotifyTrack[] }>(`/playlists/${playlistId}/items`);
    return data.tracks;
  },

  updateDetails: (playlistId: string, name?: string, description?: string) =>
    apiClient.put(`/playlists/${playlistId}/details`, { name, description }),

  addItems: (playlistId: string, trackIds: string[]) =>
    apiClient.post(`/playlists/${playlistId}/items`, { track_ids: trackIds }),

  removeItems: (playlistId: string, trackIds: string[]) =>
    apiClient.delete(`/playlists/${playlistId}/items`, { data: { track_ids: trackIds } }),

  uploadCoverImage: (playlistId: string, imageB64: string) =>
    apiClient.put(`/playlists/${playlistId}/cover-image`, { image_b64: imageB64 }),
};
