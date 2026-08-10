export interface ArtistRef {
  id: string;
  name: string;
}

export interface TasteDrift {
  steady_favorites: ArtistRef[];
  new_favorites: ArtistRef[];
  fading_favorites: ArtistRef[];
  overlap_short_vs_long_pct: number;
}

export interface GenreShare {
  genre: string;
  pct: number;
}

export interface TasteFingerprint {
  top_genres: GenreShare[];
  summary: string;
}

export interface TrackNovelty {
  track_id: string;
  track_name: string;
  novelty_score: number;
}

export interface PlaylistInsights {
  diversity_score: number;
  avg_novelty_score: number;
  track_novelty: TrackNovelty[];
}

export interface SkipStatus {
  listening_events: number;
  skip_events: number;
  ready_to_train: boolean;
  min_events_needed: number;
}

export interface SkipPollResult {
  recorded: boolean;
  track_id?: string;
  skipped?: boolean;
}
