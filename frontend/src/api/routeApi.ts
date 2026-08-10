import { apiClient } from "./client";
import type { RoutePlaylistPreview, TravelMode } from "../types/route";

export const routeApi = {
  preview: async (mood: string, origin: string, destination: string, mode: TravelMode): Promise<RoutePlaylistPreview> => {
    const { data } = await apiClient.post<RoutePlaylistPreview>("/routes/preview", {
      mood,
      origin,
      destination,
      mode,
    });
    return data;
  },
};
