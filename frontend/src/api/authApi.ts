import { apiClient } from "./client";
import { API_BASE_URL } from "../utils/constants";
import type { SessionStatus } from "../types/auth";

export const authApi = {
  loginUrl: () => `${API_BASE_URL}/auth/login`,

  me: async (): Promise<SessionStatus> => {
    const { data } = await apiClient.get<SessionStatus>("/auth/me");
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },
};
