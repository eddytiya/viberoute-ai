import type { SpotifyTrack } from "./spotify";

export type TravelMode = "driving" | "walking" | "bicycling";

export interface RouteSummaryData {
  duration_seconds: number;
  duration_text: string;
  distance_meters: number;
  distance_text: string;
  start_address: string;
  end_address: string;
  mode: string;
}

export interface RoutePlaylistPreview {
  playlist_name: string;
  playlist_description: string;
  tracks: SpotifyTrack[];
  route: RouteSummaryData;
  target_duration_ms: number;
  total_duration_ms: number;
}
