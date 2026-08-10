export interface SpotifyProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  images: { url: string }[];
  product: string | null;
}

export interface SessionStatus {
  authenticated: boolean;
  profile: SpotifyProfile | null;
}
