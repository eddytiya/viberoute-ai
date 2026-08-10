import type { SpotifyTrack } from "./spotify";

export type DiscoveryLevel = "safe" | "balanced" | "adventurous";

export type DiscoveredTrack = SpotifyTrack & { match_pct: number; reason?: string };
