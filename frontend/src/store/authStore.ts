import { create } from "zustand";

import type { SpotifyProfile } from "../types/auth";

interface AuthState {
  authenticated: boolean;
  profile: SpotifyProfile | null;
  loading: boolean;
  setSession: (authenticated: boolean, profile: SpotifyProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: false,
  profile: null,
  loading: true,
  setSession: (authenticated, profile) => set({ authenticated, profile, loading: false }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ authenticated: false, profile: null, loading: false }),
}));
