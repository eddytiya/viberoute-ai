export interface SoundMapPoint {
  track_id: string;
  name: string;
  artists: string[];
  x: number;
  y: number;
  cluster: number;
}

export interface ClusterSummary {
  cluster: number;
  label: string;
  track_count: number;
  track_ids: string[];
}

export interface SoundMapData {
  points: SoundMapPoint[];
  clusters: ClusterSummary[];
}

export interface ListeningHourCount {
  hour: number;
  count: number;
}

export interface ListeningDayCount {
  day: string;
  count: number;
}

export interface ListeningPatterns {
  by_hour: ListeningHourCount[];
  by_day: ListeningDayCount[];
}
