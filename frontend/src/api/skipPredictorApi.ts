import { apiClient } from "./client";
import type { SkipPollResult, SkipStatus } from "../types/prediction";

export const skipPredictorApi = {
  status: async (): Promise<SkipStatus> => {
    const { data } = await apiClient.get<SkipStatus>("/skip-predictor/status");
    return data;
  },

  sync: async (): Promise<SkipStatus> => {
    const { data } = await apiClient.post<SkipStatus>("/skip-predictor/sync");
    return data;
  },

  poll: async (): Promise<SkipPollResult> => {
    const { data } = await apiClient.post<SkipPollResult>("/skip-predictor/poll");
    return data;
  },
};
