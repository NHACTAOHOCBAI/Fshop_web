import { Bell, Loader2, Megaphone, Package, Star, Tag } from "lucide-react";
import { useState, type ElementType } from "react";
import ClientPagination from "@/components/pagination/ClientPagination";

import { useAdminNotificationRealtime, useAdminNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import type { Notification, NotificationTypeExtended } from "@/types/notification";

const TYPE_CONFIG: Record<NotificationTypeExtended, { icon: ElementType; className: string }> = {
    ORDER: { icon: Package, className: "bg-blue-50 text-blue-600" },
    DISCOUNT: { icon: Tag, className: "bg-amber-50 text-amber-600" },
    REVIEW: { icon: Star, className: "bg-emerald-50 text-emerald-600" },
    POST: { icon: Megaphone, className: "bg-slate-100 text-slate-600" },
    LIVESTREAM: { icon: Megaphone, className: "bg-rose-50 text-rose-600" },
    ADMIN_BROADCAST: { icon: Megaphone, className: "bg-violet-50 text-violet-600" },
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

const AdminNotificationsPage = () => {
    const [page, setPage] = useState(1);
    const limit = 10;

    const notificationsQuery = useAdminNotifications({
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    useAdminNotificationRealtime(true);

    const notifications = notificationsQuery.data?.data ?? [];
    const unreadCount = notifications.filter((item) => !item.isRead).length;
    const latestNotification = notifications[0];

    const paginationMeta = notificationsQuery.data?.meta?.pagination;
    const totalPages = paginationMeta ? Math.max(1, Math.ceil(paginationMeta.total / limit)) : 1;

    return (
        <div className="space-y-6 w-full">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Thông báo admin</h1>
                <p className="mt-1 text-sm text-slate-500">Danh sách thông báo dành cho admin, cập nhật theo thời gian thực.</p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Danh sách thông báo</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Tất cả đã được đọc"}
                            </p>
                        </div>
                        <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:w-auto">
                            <Bell className="size-3.5" />
                            Tổng {notifications.length} thông báo
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        {notificationsQuery.isLoading ? (
                            <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" />
                                Đang tải thông báo...
                            </div>
                        ) : notificationsQuery.isError ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                Không thể tải danh sách thông báo của admin.
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
                                <Bell className="size-10 text-slate-300" />
                                <p className="text-sm text-slate-500">Chưa có thông báo nào</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notification) => {
                                    const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.POST;
                                    const Icon = typeConfig.icon;

                                    return (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "flex gap-4 rounded-2xl border px-4 py-3.5 transition-colors bg-white",
                                                notification.isRead ? "border-slate-200" : "border-primary/20 bg-primary/5"
                                            )}
                                        >
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

                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">#{notification.id}</span>
                                                    <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-600">{notification.type}</span>
                                                    <span>{notification.user?.fullName || notification.user?.email || "Hệ thống"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {notificationsQuery.isFetching && (
                                    <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
                                        <Loader2 className="size-3 animate-spin" />
                                        Đang đồng bộ...
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 flex justify-center">
                                    <ClientPagination
                                        page={page}
                                        totalPages={totalPages}
                                        onPageChange={setPage}
                                        disabled={notificationsQuery.isFetching}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Bell className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Tóm tắt nhanh</p>
                            <p className="text-xs text-slate-500">Trạng thái hệ thống thông báo</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between gap-3">
                            <span>Chưa đọc</span>
                            <span className="font-semibold text-slate-900">{unreadCount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span>Tổng thông báo</span>
                            <span className="font-semibold text-slate-900">{notifications.length}</span>
                        </div>
                       
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Thông báo gần nhất</p>
                        {latestNotification ? (
                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-slate-700">{getNotificationTitle(latestNotification)}</p>
                                <p className="text-xs text-slate-500">{getNotificationMessage(latestNotification)}</p>
                                <p className="text-xs text-slate-400">{formatDateTime(latestNotification.createdAt)}</p>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">Chưa có dữ liệu.</p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default AdminNotificationsPage;
