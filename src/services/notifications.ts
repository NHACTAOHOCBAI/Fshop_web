import { io, type Socket } from "socket.io-client";

import axiosInstance from "@/lib/axios";
import { resolveSocketBaseUrl } from "@/lib/socket";
import type {
    GetAdminNotificationsParams,
    GetMyNotificationsParams,
    Notification,
} from "@/types/notification";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

export const getMyNotifications = async (params?: GetMyNotificationsParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Notification>>("/notifications/me", {
        params,
    });

    return data;
};

export const markNotificationAsRead = async (id: number) => {
    const { data } = await axiosInstance.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return data;
};

export const markAllNotificationsAsRead = async () => {
    const { data } = await axiosInstance.patch<ApiResponse<unknown>>("/notifications/read-all");
    return data;
};

export const getAdminNotifications = async (params?: GetAdminNotificationsParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Notification>>("/notifications/admin", {
        params,
    });

    return data;
};

export const connectNotificationsSocket = (accessToken: string): Socket => {
    return io(resolveSocketBaseUrl(), {
        transports: ["websocket"],
        auth: { token: accessToken },
        reconnection: true,
    });
};
