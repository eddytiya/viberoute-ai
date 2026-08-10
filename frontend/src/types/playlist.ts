import type { SpotifyTrack } from "./spotify";

export interface PlaylistPreview {
  playlist_name: string;
  playlist_description: string;
  tracks: SpotifyTrack[];
}

export interface SavedPlaylist {
  id: string;
  name: string;
  spotify_playlist_id: string | null;
  spotify_url: string | null;
}

export interface PlaylistHistoryItem {
  id: string;
  name: string;
  description: string | null;
  source: string;
  spotify_playlist_id: string | null;
  spotify_url: string | null;
  created_at: string;
  tracks: SpotifyTrack[];
}

export interface UserPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
  external_urls: { spotify: string };
}
