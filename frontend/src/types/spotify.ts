export interface SpotifyImage {
  url: string;
  width?: number;
  height?: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
  genres?: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    name: string;
    images: SpotifyImage[];
  };
  duration_ms: number;
  external_urls: { spotify: string };
}

export interface NowPlaying {
  is_playing: boolean;
  progress_ms: number;
  device_id: string | null;
  device_name: string | null;
  volume_percent: number | null;
  shuffle_state: boolean;
  repeat_state: string;
  track: SpotifyTrack;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number | null;
}
