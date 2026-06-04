import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/response";
import type {
  ModerationLog,
  ModerationQueueQuery,
  ModerationQueueResponse,
  ModerationRecentResponse,
  ModerationStats,
} from "@/types/moderation";

const API_BASE = "/admin/moderation";

export const getModerationQueue = async (
  params: ModerationQueueQuery = {}
): Promise<ApiResponse<ModerationQueueResponse>> => {
  const { data } = await axiosInstance.get<ApiResponse<ModerationQueueResponse>>(
    `${API_BASE}/queue`,
    { params }
  );
  return data;
};

export const getModerationStats = async (): Promise<ApiResponse<ModerationStats>> => {
  const { data } = await axiosInstance.get<ApiResponse<ModerationStats>>(
    `${API_BASE}/stats`
  );
  return data;
};

export const getModerationRecent = async (
  limit = 6,
): Promise<ApiResponse<ModerationRecentResponse>> => {
  const { data } = await axiosInstance.get<ApiResponse<ModerationRecentResponse>>(
    `${API_BASE}/recent`,
    { params: { limit } },
  );
  return data;
};

export const overrideDecision = async (
  logId: number,
  decision: "approved" | "rejected"
): Promise<ApiResponse<ModerationLog>> => {
  const { data } = await axiosInstance.patch<ApiResponse<ModerationLog>>(
    `${API_BASE}/${logId}/decision`,
    { decision }
  );
  return data;
};
