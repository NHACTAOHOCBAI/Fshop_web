import { Loader2, Megaphone } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
    useAdminNotificationRealtime,
    useAdminNotifications,
    useCreateAdminBroadcast,
} from "@/hooks/useNotifications";
import type { NotificationTypeExtended } from "@/types/notification";

const TYPE_OPTIONS: NotificationTypeExtended[] = [
    "ADMIN_BROADCAST",
    "LIVESTREAM",
    "DISCOUNT",
    "ORDER",
    "REVIEW",
    "POST",
];

const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const AdminNotificationsPage = () => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [typeFilter, setTypeFilter] = useState<"all" | NotificationTypeExtended>("all");

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [broadcastType, setBroadcastType] = useState<NotificationTypeExtended>("ADMIN_BROADCAST");

    const notificationsQuery = useAdminNotifications({
        page,
        limit,
        search: search.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "DESC",
        type: typeFilter === "all" ? undefined : typeFilter,
    });

    const createBroadcastMutation = useCreateAdminBroadcast();

    useAdminNotificationRealtime(true);

    const notifications = notificationsQuery.data?.data ?? [];
    const total = notificationsQuery.data?.meta?.pagination?.total ?? notifications.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const canSubmit = useMemo(
        () => title.trim().length > 0 && message.trim().length > 0 && !createBroadcastMutation.isPending,
        [createBroadcastMutation.isPending, message, title],
    );

    const handleCreateBroadcast = () => {
        if (!canSubmit) return;

        createBroadcastMutation.mutate(
            {
                title: title.trim(),
                message: message.trim(),
                type: broadcastType,
            },
            {
                onSuccess: (response) => {
                    toast.success(`Đã gửi thông báo đến ${response.data.totalRecipients} người dùng active.`);
                    setTitle("");
                    setMessage("");
                },
                onError: (error) => toast.error(error.message || "Không thể gửi broadcast."),
            },
        );
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý thông báo</h1>
                <p className="mt-1 text-sm text-slate-500">Tạo broadcast đến toàn bộ user active và theo dõi danh sách thông báo theo thời gian thực.</p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Tạo broadcast mới</p>
                <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1fr]">
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Tiêu đề thông báo"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary"
                    />
                    <select
                        value={broadcastType}
                        onChange={(event) => setBroadcastType(event.target.value as NotificationTypeExtended)}
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary"
                    >
                        {TYPE_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>
                <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Nội dung thông báo"
                    className="mt-3 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                    type="button"
                    onClick={handleCreateBroadcast}
                    disabled={!canSubmit}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {createBroadcastMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
                    Gửi đến toàn bộ user active
                </button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Tìm theo tiêu đề hoặc nội dung"
                        className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary md:w-90"
                    />
                    <div className="flex gap-2">
                        <select
                            value={typeFilter}
                            onChange={(event) => {
                                setTypeFilter(event.target.value as "all" | NotificationTypeExtended);
                                setPage(1);
                            }}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary"
                        >
                            <option value="all">Tất cả loại</option>
                            {TYPE_OPTIONS.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                        <select
                            value={String(limit)}
                            onChange={(event) => {
                                setLimit(Number(event.target.value));
                                setPage(1);
                            }}
                            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary"
                        >
                            {[10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size} / trang
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    {notificationsQuery.isLoading ? (
                        <div className="flex items-center justify-center rounded-xl border border-slate-100 py-12 text-sm text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Đang tải thông báo...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
                            Chưa có thông báo nào.
                        </div>
                    ) : (
                        notifications.map((item) => (
                            <article key={item.id} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">#{item.id}</span>
                                    <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-600">{item.type}</span>
                                    <span>{formatDateTime(item.createdAt)}</span>
                                    <span>{item.user?.fullName || item.user?.email || "Unknown user"}</span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-slate-900">{item.title || "Thông báo mới"}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.message || "Không có nội dung"}</p>
                            </article>
                        ))
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>Trang {page} / {totalPages}</span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page <= 1 || notificationsQuery.isFetching}
                        >
                            Trước
                        </button>
                        <button
                            type="button"
                            className="rounded border border-slate-200 px-3 py-1 disabled:opacity-50"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page >= totalPages || notificationsQuery.isFetching}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AdminNotificationsPage;
