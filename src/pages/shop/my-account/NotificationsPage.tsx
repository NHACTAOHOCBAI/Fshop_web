import { AlertTriangle, Bell, CheckCheck, ChevronRight, Loader2, Megaphone, Package, Star, Tag } from "lucide-react";
import { type ElementType, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import {
    useMarkAllNotificationsAsRead,
    useMarkNotificationAsRead,
    useMyNotifications,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { Notification, NotificationTypeExtended } from "@/types/notification";
import ClientPagination from "@/components/pagination/ClientPagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_CONFIG: Record<NotificationTypeExtended, { icon: ElementType; className: string }> = {
    ORDER: { icon: Package, className: "bg-blue-50 text-blue-600" },
    DISCOUNT: { icon: Tag, className: "bg-amber-50 text-amber-600" },
    REVIEW: { icon: Star, className: "bg-emerald-50 text-emerald-600" },
    POST: { icon: Megaphone, className: "bg-slate-100 text-slate-600" },
    LIVESTREAM: { icon: Megaphone, className: "bg-rose-50 text-rose-600" },
    ADMIN_BROADCAST: { icon: Megaphone, className: "bg-violet-50 text-violet-600" },
    INVENTORY: { icon: AlertTriangle, className: "bg-red-50 text-red-600" },
};

const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Vừa xong";
    }

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const getNotificationTitle = (notification: Notification) => {
    return notification.title?.trim() || "Thông báo mới";
};

const getNotificationMessage = (notification: Notification) => {
    return notification.message?.trim() || "Bạn có một thông báo mới từ hệ thống.";
};

/**
 * Tries to extract a numeric ID from notification title/message.
 * Looks for patterns like "#47" which appear in order notification titles.
 * e.g. "Đơn hàng #47 cập nhật" → 47
 */
const extractIdFromText = (text?: string | null): number | null => {
    if (!text) return null;
    const match = text.match(/#(\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

/**
 * Maps notification type + referenceId to a navigable route.
 * Priority: referenceId → parsed from title → fallback list page.
 * DISCOUNT / ADMIN_BROADCAST → no navigation.
 */
const getNotificationLink = (notification: Notification): string | null => {
    const ref = notification.referenceId;

    switch (notification.type) {
        case "ORDER":
        case "REVIEW": {
            const orderId = ref ?? extractIdFromText(notification.title) ?? extractIdFromText(notification.message);
            return orderId ? `/my-account/orders/${orderId}` : `/my-account/orders`;
        }
        case "POST": {
            if (!ref) return `/community`;
            // Follow notifications: referenceId is followerId → user blog page
            if (notification.title?.includes("theo dõi")) {
                return `/community/user/${ref}`;
            }
            // Like / comment / reply / admin hide → specific post
            return `/community/${ref}`;
        }
        case "LIVESTREAM": {
            const liveId = ref ?? extractIdFromText(notification.title) ?? extractIdFromText(notification.message);
            return liveId ? `/livestreams/${liveId}` : `/livestreams`;
        }
        case "INVENTORY": {
            return ref ? `/admin/products/${ref}/edit` : `/admin/products`;
        }
        default:
            return null;
    }
};

const NotificationsPage = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all");
    const limit = 20;

    const { data, isLoading, isFetching, isError, error } = useMyNotifications({
        page,
        limit,
        isRead: statusFilter === "all" ? undefined : statusFilter === "read",
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const { mutate: markOneAsRead, isPending: isMarkingOne } = useMarkNotificationAsRead();
    const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead();

    const notifications = data?.data ?? [];
    const paginationMeta = data?.meta?.pagination;
    const totalPages = paginationMeta ? Math.max(1, Math.ceil(paginationMeta.total / limit)) : 1;

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    const handleMarkOneAsRead = (id: number) => {
        markOneAsRead(id, {
            onError: (markError: Error) => {
                toast.error(markError.message || "Không thể đánh dấu đã đọc.");
            },
        });
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead(undefined, {
            onSuccess: () => {
                toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
            },
            onError: (markAllError: Error) => {
                toast.error(markAllError.message || "Không thể cập nhật tất cả thông báo.");
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thông báo</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đã được đọc"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAll}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                        {isMarkingAll ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            <div className="border-slate-100">
                <Tabs
                    value={statusFilter}
                    onValueChange={(val) => {
                        setStatusFilter(val as typeof statusFilter);
                        setPage(1);
                    }}
                    className="h-9"
                >
                    <TabsList className="h-9 bg-slate-100 p-0.5 rounded-xl">
                        <TabsTrigger value="all" className="h-8 px-4 rounded-lg data-[state=active]:bg-white text-xs cursor-pointer">
                            Tất cả
                        </TabsTrigger>
                        <TabsTrigger value="unread" className="h-8 px-4 rounded-lg data-[state=active]:bg-white text-xs cursor-pointer">
                            Chưa đọc
                        </TabsTrigger>
                        <TabsTrigger value="read" className="h-8 px-4 rounded-lg data-[state=active]:bg-white text-xs cursor-pointer">
                            Đã đọc
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tải thông báo...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error instanceof Error ? error.message : "Không thể tải danh sách thông báo."}
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
                    <Bell className="size-10 text-slate-300" />
                    <p className="text-sm text-slate-500">Chưa có thông báo nào</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => {
                        const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.POST;
                        const Icon = typeConfig.icon;
                        const link = getNotificationLink(notification);

                        const itemContent = (
                            <>
                                <div
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                                        typeConfig.className
                                    )}
                                >
                                    <Icon className="size-4" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                                        <p
                                            className={cn(
                                                "text-sm",
                                                notification.isRead
                                                    ? "font-medium text-slate-700"
                                                    : "font-semibold text-slate-900"
                                            )}
                                        >
                                            {getNotificationTitle(notification)}
                                        </p>
                                        <div className="flex shrink-0 items-center gap-2 sm:self-start">
                                            <span className="text-xs text-slate-400">{formatDateTime(notification.createdAt)}</span>
                                            {!notification.isRead && <span className="size-2 rounded-full bg-primary" />}
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{getNotificationMessage(notification)}</p>

                                    {!notification.isRead && (
                                        <button
                                            type="button"
                                            disabled={isMarkingOne}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMarkOneAsRead(notification.id);
                                            }}
                                            className="mt-2 text-xs font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Đánh dấu đã đọc
                                        </button>
                                    )}
                                </div>

                                {link && (
                                    <ChevronRight className="size-4 shrink-0 self-center text-slate-300 group-hover:text-slate-500 transition-colors" />
                                )}
                            </>
                        );

                        const wrapperClass = cn(
                            "group flex gap-4 rounded-2xl border px-4 py-3.5 transition-colors",
                            notification.isRead ? "border-slate-200 bg-white" : "border-primary/20 bg-primary/5",
                            link && "hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                        );

                        if (link) {
                            return (
                                <Link
                                    key={notification.id}
                                    to={link}
                                    className={wrapperClass}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            handleMarkOneAsRead(notification.id);
                                        }
                                    }}
                                >
                                    {itemContent}
                                </Link>
                            );
                        }

                        return (
                            <div key={notification.id} className={wrapperClass}>
                                {itemContent}
                            </div>
                        );
                    })}

                    {isFetching && (
                        <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
                            <Loader2 className="size-3 animate-spin" />
                            Đang đồng bộ...
                        </div>
                    )}

                    {!isLoading && totalPages > 1 && (
                        <div className="mt-6 flex justify-center pb-8">
                            <ClientPagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                disabled={isFetching}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
