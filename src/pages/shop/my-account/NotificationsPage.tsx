import { Bell, CheckCheck, Package, Tag, Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";

type NotifType = "order" | "promo" | "system";

const TYPE_ICON: Record<NotifType, React.ElementType> = {
    order: Package,
    promo: Tag,
    system: Megaphone,
};

const TYPE_STYLE: Record<NotifType, string> = {
    order: "bg-blue-50 text-blue-500",
    promo: "bg-amber-50 text-amber-500",
    system: "bg-slate-100 text-slate-500",
};

const mockNotifications = [
    {
        id: 1,
        type: "order" as NotifType,
        title: "Đơn hàng ORD-2024-002 đang được giao",
        body: "Đơn hàng của bạn đã được bàn giao cho đơn vị vận chuyển. Dự kiến giao trong 1–2 ngày làm việc.",
        time: "2 giờ trước",
        read: false,
    },
    {
        id: 2,
        type: "promo" as NotifType,
        title: "Flash sale 8/3 – Giảm đến 50%",
        body: "Hàng ngàn sản phẩm thời trang được giảm giá sâu chỉ trong hôm nay. Đừng bỏ lỡ!",
        time: "1 ngày trước",
        read: false,
    },
    {
        id: 3,
        type: "order" as NotifType,
        title: "Đơn hàng ORD-2024-001 đã được giao thành công",
        body: "Cảm ơn bạn đã mua sắm tại FShop. Hãy để lại đánh giá để nhận điểm thưởng.",
        time: "3 ngày trước",
        read: true,
    },
    {
        id: 4,
        type: "system" as NotifType,
        title: "Cập nhật chính sách bảo mật",
        body: "Chúng tôi vừa cập nhật chính sách quyền riêng tư. Vui lòng đọc để biết thêm chi tiết.",
        time: "5 ngày trước",
        read: true,
    },
    {
        id: 5,
        type: "promo" as NotifType,
        title: "Bộ sưu tập Xuân Hè 2024 đã ra mắt",
        body: "Khám phá hơn 500 mẫu mới với phong cách trẻ trung, năng động chỉ có tại FShop.",
        time: "1 tuần trước",
        read: true,
    },
    {
        id: 6,
        type: "order" as NotifType,
        title: "Đơn hàng ORD-2024-003 đã bị huỷ",
        body: "Đơn hàng của bạn đã bị huỷ theo yêu cầu. Hoàn tiền sẽ được xử lý trong 3–5 ngày làm việc.",
        time: "1 tuần trước",
        read: true,
    },
];

const unreadCount = mockNotifications.filter((n) => !n.read).length;

const NotificationsPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Thông báo</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {unreadCount > 0
                            ? `${unreadCount} thông báo chưa đọc`
                            : "Tất cả đã được đọc"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                        <CheckCheck className="size-3.5" />
                        Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {mockNotifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
                    <Bell className="size-10 text-slate-300" />
                    <p className="text-sm text-slate-500">Chưa có thông báo nào</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {mockNotifications.map((notif) => {
                        const Icon = TYPE_ICON[notif.type];
                        return (
                            <div
                                key={notif.id}
                                className={cn(
                                    "flex gap-4 rounded-2xl border px-4 py-3.5 transition-colors",
                                    notif.read
                                        ? "border-slate-200 bg-white"
                                        : "border-primary/20 bg-primary/5"
                                )}
                            >
                                {/* Icon */}
                                <div
                                    className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                                        TYPE_STYLE[notif.type]
                                    )}
                                >
                                    <Icon className="size-4" />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={cn(
                                                "text-sm",
                                                notif.read
                                                    ? "font-medium text-slate-700"
                                                    : "font-semibold text-slate-900"
                                            )}
                                        >
                                            {notif.title}
                                        </p>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="text-xs text-slate-400">{notif.time}</span>
                                            {!notif.read && (
                                                <span className="size-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{notif.body}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
