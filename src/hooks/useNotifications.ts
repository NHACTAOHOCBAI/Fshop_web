import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import {
    connectNotificationsSocket,
    getMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "@/services/notifications";
import type { GetMyNotificationsParams, Notification } from "@/types/notification";
import type { PaginatedApiResponse } from "@/types/response";

export const MY_NOTIFICATIONS_QUERY_KEY = ["notifications", "me"] as const;

export const useMyNotifications = (params?: GetMyNotificationsParams) => {
    return useQuery({
        queryKey: [...MY_NOTIFICATIONS_QUERY_KEY, params],
        queryFn: () => getMyNotifications(params),
        enabled: Boolean(authStorage.getAccessToken()),
    });
};

export const useMarkNotificationAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_NOTIFICATIONS_QUERY_KEY });
        },
    });
};

export const useMarkAllNotificationsAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_NOTIFICATIONS_QUERY_KEY });
        },
    });
};

export const useNotificationRealtime = (enabled = true) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) return;

        const accessToken = authStorage.getAccessToken();
        if (!accessToken) return;

        const socket = connectNotificationsSocket(accessToken);

        const handleNotificationReceived = (incoming: Notification) => {
            let hasCache = false;

            queryClient.setQueriesData<PaginatedApiResponse<Notification>>({ queryKey: MY_NOTIFICATIONS_QUERY_KEY }, (old) => {
                if (!old) {
                    return old;
                }

                hasCache = true;

                const exists = old.data.some((item) => item.id === incoming.id);
                const nextData = exists
                    ? old.data.map((item) => (item.id === incoming.id ? incoming : item))
                    : [incoming, ...old.data];

                const nextMeta =
                    old.meta?.pagination && typeof old.meta.pagination.total === "number" && !exists
                        ? {
                              ...old.meta,
                              pagination: {
                                  ...old.meta.pagination,
                                  total: old.meta.pagination.total + 1,
                              },
                          }
                        : old.meta;

                return {
                    ...old,
                    data: nextData,
                    meta: nextMeta,
                };
            });

            if (!hasCache) {
                queryClient.invalidateQueries({ queryKey: MY_NOTIFICATIONS_QUERY_KEY });
            }
        };

        socket.on("notification_received", handleNotificationReceived);

        return () => {
            socket.off("notification_received", handleNotificationReceived);
            socket.disconnect();
        };
    }, [enabled, queryClient]);
};
