import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Bell, Heart, Loader2, ShoppingCart, UserRound } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMarkNotificationAsRead, useMyNotifications, useNotificationRealtime } from "@/hooks/useNotifications";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

const navItems = [
    { to: "/", label: "Trang chủ", end: true },
    { to: "/men", label: "Nam", end: false },
    { to: "/women", label: "Nữ", end: false },
    { to: "/kids", label: "Trẻ em", end: false },
    { to: "/livestreams", label: "Live", end: false },
];

const formatNotificationTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Vừa xong";
    }

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });
};

const getNotificationTitle = (notification: Notification) => {
    return notification.title?.trim() || "Thông báo mới";
};

const ClientLayout = () => {
    const router = useNavigate();
    const params = useParams<{ department?: string }>();
    const location = useLocation();
    const pathname = location.pathname.toLowerCase();
    const currentDepartment = params.department?.toLowerCase();
    const breadcrumbDepartment = currentDepartment === "men" || currentDepartment === "women" || currentDepartment === "kids"
        ? currentDepartment
        : "men";
    const breadcrumbDepartmentLabel = pathname.startsWith("/my-account/orders")
        ? "đơn hàng của tôi"
        : pathname.startsWith("/my-account/addresses")
            ? "địa chỉ của tôi"
            : pathname.startsWith("/my-account/wishlists")
                ? "yêu thích"
                : pathname.startsWith("/my-account/notifications")
                    ? "thông báo"
                    : pathname.startsWith("/my-account")
                        ? "tài khoản"
                        : pathname.startsWith("/checkout")
                            ? "thanh toán"
                            : pathname.startsWith("/cart")
                                ? "giỏ hàng của tôi"
                                : breadcrumbDepartment === "men"
                                    ? "nam"
                                    : breadcrumbDepartment === "women"
                                        ? "nữ"
                                        : "trẻ-em";
    const isAuthenticated = Boolean(authStorage.getAccessToken());

    useNotificationRealtime(isAuthenticated);

    const { data: notificationsData, isFetching: isFetchingNotifications } = useMyNotifications({
        page: 1,
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const { mutate: markOneAsRead } = useMarkNotificationAsRead();

    const notifications = notificationsData?.data ?? [];
    const unreadCount = notifications.filter((item) => !item.isRead).length;

    const handleOpenNotification = (notification: Notification) => {
        if (!notification.isRead) {
            markOneAsRead(notification.id);
        }

        router("/my-account/notifications");
    };

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3  border-slate-100 px-4 py-1 md:px-8">
                    <div className="flex items-center gap-2 text-slate-500">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="relative rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
                                    <Bell className="size-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-96 rounded-xl p-0">
                                <div className="border-b border-slate-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-slate-900">Thông báo</p>
                                    <p className="text-xs text-slate-500">
                                        {unreadCount > 0 ? `${unreadCount} chưa đọc` : "Bạn đã đọc hết"}
                                    </p>
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {isFetchingNotifications ? (
                                        <div className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-slate-500">
                                            <Loader2 className="size-3 animate-spin" />
                                            Đang tải...
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="px-4 py-6 text-center text-xs text-slate-500">Chưa có thông báo nào</div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <button
                                                key={notification.id}
                                                type="button"
                                                onClick={() => handleOpenNotification(notification)}
                                                className={cn(
                                                    "w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-none hover:bg-slate-50",
                                                    !notification.isRead && "bg-primary/5"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="line-clamp-1 text-sm font-medium text-slate-800">{getNotificationTitle(notification)}</p>
                                                    <span className="shrink-0 text-[11px] text-slate-400">{formatNotificationTime(notification.createdAt)}</span>
                                                </div>
                                                {notification.message && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{notification.message}</p>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>

                                <div className="border-t border-slate-100 px-4 py-2">
                                    <button
                                        type="button"
                                        onClick={() => router("/my-account/notifications")}
                                        className="w-full rounded-md py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                                    >
                                        Xem tất cả thông báo
                                    </button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <button onClick={() => router("/my-account/wishlists")} type="button" className="rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
                            <Heart className="size-4" />
                        </button>
                        <button onClick={() => router("/cart")} type="button" className="rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
                            <ShoppingCart className="size-4" />
                        </button>
                        <button onClick={() => router("/my-account/profile")} type="button" className="rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
                            <UserRound className="size-4" />
                        </button>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-px">

                </div>
                <div className="mx-auto flex w-full max-w-6xl items-center  px-4 py-3 md:px-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground shadow-sm">
                            F
                        </span>
                        <span className="text-base font-semibold tracking-wide">FShop</span>
                    </Link>
                    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold md:gap-10 ml-85">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    cn(
                                        "uppercase tracking-wider text-slate-700 transition-colors hover:text-primary",
                                        isActive && "text-primary"
                                    )
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </header>
            {pathname !== "/" && (
                <div className="bg-gray-100 py-3.5">
                    <div className="px-4  md:px-8 mx-auto max-w-6xl text-sm text-slate-500">
                        <span>Fshop</span>
                        <span className="mx-2">/</span>
                        <span className="text-primary">{breadcrumbDepartmentLabel}</span>
                    </div>
                </div>
            )}
            <main className=" mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
                <Outlet />
            </main>

            <footer className="mt-12 bg-primary/35">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm text-slate-700 md:grid-cols-3 md:px-8">
                    <div>
                        <p className="font-semibold text-slate-900">FShop</p>
                        <p className="mt-2">Nền tảng bán hàng thời trang online với trải nghiệm nhanh và ổn định.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Theo dõi chúng tôi</p>
                        <p className="mt-2">Cập nhật xu hướng và bộ sưu tập mới mỗi tuần.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Liên hệ</p>
                        <p className="mt-2">E-Comm, Thu Duc, Ho Chi Minh City</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ClientLayout;
