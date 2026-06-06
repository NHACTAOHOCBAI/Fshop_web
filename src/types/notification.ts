import type { QueryParams } from "@/types/query";

export type NotificationType = "DISCOUNT" | "ORDER" | "REVIEW" | "POST";

export type NotificationTypeExtended =
    | "DISCOUNT"
    | "ORDER"
    | "REVIEW"
    | "POST"
    | "LIVESTREAM"
    | "ADMIN_BROADCAST";

export type Notification = {
    id: number;
    title?: string | null;
    message?: string | null;
    type: NotificationTypeExtended;
    isRead: boolean;
    createdAt: string;
    referenceId?: number | null;
    user?: {
        id: number;
        fullName?: string | null;
        email?: string;
    };
};

export type GetMyNotificationsParams = QueryParams & {
    type?: NotificationTypeExtended;
    isRead?: boolean;
};

export type GetAdminNotificationsParams = QueryParams & {
    type?: NotificationTypeExtended;
    isRead?: boolean;
};
