import { apiClient } from "./client";
import type { Critique, CriticMode } from "../types/critic";

export const criticApi = {
  critique: async (mode: CriticMode): Promise<Critique> => {
    const { data } = await apiClient.post<Critique>("/music-critic/critique", { mode });
    return data;
  },
};
