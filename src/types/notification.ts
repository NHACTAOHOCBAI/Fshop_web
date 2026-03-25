import type { QueryParams } from "@/types/query";

export type NotificationType = "DISCOUNT" | "ORDER" | "REVIEW" | "POST";

export type Notification = {
    id: number;
    title?: string | null;
    message?: string | null;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
};

export type GetMyNotificationsParams = QueryParams & {
    type?: NotificationType;
    isRead?: boolean;
};
