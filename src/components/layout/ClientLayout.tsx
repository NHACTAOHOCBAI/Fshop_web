import { NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Bell, Heart, Loader2, Menu, ShoppingCart, UserRound, X } from "lucide-react";
import { useState } from "react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FShopLogo from "@/components/layout/FShopLogo";
import FloatingAiChatbot from "@/components/layout/FloatingAiChatbot";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useMarkNotificationAsRead, useMyNotifications, useNotificationRealtime } from "@/hooks/useNotifications";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

const navItems = [
    { to: "/", label: "Trang chủ", end: true },
    { to: "/men", label: "Nam", end: false },
    { to: "/women", label: "Nữ", end: false },
    { to: "/kids", label: "Trẻ em", end: false },
    { to: "/mix-match", label: "Mix & Match", end: false },
    { to: "/livestreams", label: "Live", end: false },
    { to: "/community", label: "Community", end: false },
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
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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
                        : pathname.startsWith("/community")
                            ? "community"
                        : pathname.startsWith("/mix-match")
                            ? "mix & match"
                        : pathname.startsWith("/livestreams")
                            ? "live"
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
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const { mutate: markOneAsRead } = useMarkNotificationAsRead();

    const notifications = notificationsData?.data ?? [];
    const unreadCount = notifications.filter((item) => !item.isRead).length;
    const quickActionClass = "rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary";

    const handleOpenNotification = (notification: Notification) => {
        if (!notification.isRead) {
            markOneAsRead(notification.id);
        }

        router("/my-account/notifications");
    };

    return (
        <div className="flex min-h-screen flex-col bg-white text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
                <div className="mx-auto hidden w-full max-w-6xl items-center justify-end gap-3 border-slate-100 px-4 py-1 md:flex md:px-8">
                    <div className="flex items-center gap-2 text-slate-500">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="relative rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
                                    <Bell className="size-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-xl p-0">
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
                        <button onClick={() => router("/my-account/wishlists")} type="button" className={quickActionClass}>
                            <Heart className="size-4" />
                        </button>
                        <button onClick={() => router("/cart")} type="button" className={quickActionClass}>
                            <ShoppingCart className="size-4" />
                        </button>
                        <button onClick={() => router("/my-account/profile")} type="button" className={quickActionClass}>
                            <UserRound className="size-4" />
                        </button>
                    </div>
                </div>
                <div className="h-px w-full bg-slate-100" />
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-8 md:py-3">
                    <FShopLogo />
                    <div className="flex items-center gap-1 md:hidden">
                        <button
                            type="button"
                            onClick={() => router("/my-account/notifications")}
                            className={cn(quickActionClass, "relative")}
                            aria-label="Mở trang thông báo"
                        >
                            <Bell className="size-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-white">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>

                        <button onClick={() => router("/cart")} type="button" className={quickActionClass}>
                            <ShoppingCart className="size-4" />
                        </button>

                        <button onClick={() => router("/my-account/profile")} type="button" className={quickActionClass}>
                            <UserRound className="size-4" />
                        </button>

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100"
                            onClick={() => setIsMobileNavOpen((prev) => !prev)}
                            aria-label={isMobileNavOpen ? "Đóng menu" : "Mở menu"}
                        >
                            {isMobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>

                    <nav className="hidden flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold md:flex md:gap-10">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                end={item.end}
                                onClick={() => setIsMobileNavOpen(false)}
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

                <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                    <SheetContent side="left" className="w-[84vw] max-w-xs p-0 md:hidden">
                        <SheetHeader className="border-b border-slate-100">
                            <SheetTitle>Điều hướng</SheetTitle>
                        </SheetHeader>

                        <div className="space-y-2 p-4">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setIsMobileNavOpen(false)}
                                    className={({ isActive }) =>
                                        cn(
                                            "block rounded-lg border px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                                            isActive
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-slate-200 text-slate-700 hover:border-primary/40"
                                        )
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>

                        <div className="mt-auto border-t border-slate-100 p-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setIsMobileNavOpen(false); router("/my-account/wishlists"); }} type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                                    Yêu thích
                                </button>
                                <button onClick={() => { setIsMobileNavOpen(false); router("/my-account/profile"); }} type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                                    Tài khoản
                                </button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </header>
            {pathname !== "/" && (
                <div className="bg-gray-100 py-2.5 sm:py-3.5">
                    <div className="mx-auto max-w-6xl px-4 text-sm text-slate-500 md:px-8">
                        <span>Fshop</span>
                        <span className="mx-2">/</span>
                        <span className="break-words text-primary">{breadcrumbDepartmentLabel}</span>
                    </div>
                </div>
            )}
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 md:px-8 md:py-8">
                <Outlet />
            </main>

            <FloatingAiChatbot />

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

            <FloatingAiChatbot />
        </div>
    );
};

export default ClientLayout;
