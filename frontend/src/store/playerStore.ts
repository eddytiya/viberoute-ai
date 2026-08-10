import { create } from "zustand";

interface PlayerState {
  sdkReady: boolean;
  deviceId: string | null;
  setSdkReady: (ready: boolean, deviceId: string | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  sdkReady: false,
  deviceId: null,
  setSdkReady: (sdkReady, deviceId) => set({ sdkReady, deviceId }),
}));
