import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authStorage } from "@/lib/auth";
import * as moderationService from "@/services/moderation";
import { connectNotificationsSocket } from "@/services/notifications";
import type { ModerationQueueQuery } from "@/types/moderation";

export const MODERATION_QUEUE_KEY = ["moderation", "queue"];
export const MODERATION_STATS_KEY = ["moderation", "stats"];
export const MODERATION_RECENT_KEY = ["moderation", "recent"];

export const useModerationQueue = (params?: ModerationQueueQuery) => {
  return useQuery({
    queryKey: [...MODERATION_QUEUE_KEY, params],
    queryFn: () => moderationService.getModerationQueue(params),
    staleTime: 30_000,
  });
};

export const useModerationStats = () => {
  return useQuery({
    queryKey: MODERATION_STATS_KEY,
    queryFn: () => moderationService.getModerationStats(),
    staleTime: 60_000,
  });
};

export const useModerationRecent = (limit = 6) => {
  return useQuery({
    queryKey: [...MODERATION_RECENT_KEY, limit],
    queryFn: () => moderationService.getModerationRecent(limit),
    staleTime: 30_000,
  });
};

export const useOverrideDecision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      logId,
      decision,
    }: {
      logId: number;
      decision: "approved" | "rejected";
    }) => moderationService.overrideDecision(logId, decision),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MODERATION_QUEUE_KEY });
      void queryClient.invalidateQueries({ queryKey: MODERATION_STATS_KEY });
      void queryClient.invalidateQueries({ queryKey: MODERATION_RECENT_KEY });
    },
  });
};

export const useModerationRealtime = (enabled = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const accessToken = authStorage.getAccessToken();
    if (!accessToken) return;

    const socket = connectNotificationsSocket(accessToken);

    const handleModerationChanged = () => {
      void queryClient.invalidateQueries({ queryKey: MODERATION_QUEUE_KEY });
      void queryClient.invalidateQueries({ queryKey: MODERATION_STATS_KEY });
      void queryClient.invalidateQueries({ queryKey: MODERATION_RECENT_KEY });
    };

    socket.on("moderation_changed", handleModerationChanged);

    return () => {
      socket.off("moderation_changed", handleModerationChanged);
      socket.disconnect();
    };
  }, [enabled, queryClient]);
};
