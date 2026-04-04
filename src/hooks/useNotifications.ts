import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import {
    connectNotificationsSocket,
    createAdminBroadcast,
    getAdminNotifications,
    getMyNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "@/services/notifications";
import type {
    CreateAdminBroadcastPayload,
    GetAdminNotificationsParams,
    GetMyNotificationsParams,
    Notification,
} from "@/types/notification";
import type { PaginatedApiResponse } from "@/types/response";

export const MY_NOTIFICATIONS_QUERY_KEY = ["notifications", "me"] as const;
export const ADMIN_NOTIFICATIONS_QUERY_KEY = ["notifications", "admin"] as const;

const isNotificationCollection = (
    old: PaginatedApiResponse<Notification> | undefined,
): old is PaginatedApiResponse<Notification> => {
    if (!old || !Array.isArray(old.data)) return false;

    return old.data.every(
        (item) => item && typeof item === "object" && typeof item.id === "number",
    );
};

const upsertNotification = (
    old: PaginatedApiResponse<Notification>,
    incoming: Notification,
    mode: "prepend" | "updateOnly" = "prepend",
) => {
    const exists = old.data.some((item) => item.id === incoming.id);
    if (exists) {
        return {
            ...old,
            data: old.data.map((item) => (item.id === incoming.id ? incoming : item)),
        };
    }

    if (mode === "updateOnly") {
        return old;
    }

    const nextMeta =
        old.meta?.pagination && typeof old.meta.pagination.total === "number"
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
        data: [incoming, ...old.data],
        meta: nextMeta,
    };
};

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

export const useAdminNotifications = (params?: GetAdminNotificationsParams) => {
    return useQuery({
        queryKey: [...ADMIN_NOTIFICATIONS_QUERY_KEY, params],
        queryFn: () => getAdminNotifications(params),
        enabled: Boolean(authStorage.getAccessToken()),
    });
};

export const useCreateAdminBroadcast = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateAdminBroadcastPayload) => createAdminBroadcast(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY });
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
                if (!isNotificationCollection(old)) {
                    return old;
                }

                hasCache = true;
                return upsertNotification(old, incoming, "prepend");
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

export const useAdminNotificationRealtime = (enabled = true) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) return;

        const accessToken = authStorage.getAccessToken();
        if (!accessToken) return;

        const socket = connectNotificationsSocket(accessToken);

        const onAdminNotificationCreated = () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY });
        };

        const onNotificationReceived = (incoming: Notification) => {
            queryClient.setQueriesData<PaginatedApiResponse<Notification>>(
                { queryKey: ADMIN_NOTIFICATIONS_QUERY_KEY },
                (old) => {
                    if (!isNotificationCollection(old)) return old;
                    return upsertNotification(old, incoming, "prepend");
                },
            );
        };

        socket.on("admin_notification_created", onAdminNotificationCreated);
        socket.on("notification_received", onNotificationReceived);

        return () => {
            socket.off("admin_notification_created", onAdminNotificationCreated);
            socket.off("notification_received", onNotificationReceived);
            socket.disconnect();
        };
    }, [enabled, queryClient]);
};
