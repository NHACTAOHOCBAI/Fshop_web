import { useEffect, useState } from "react";
import { Bell, Heart, LogOutIcon, MapPinHouse, MessageCircle, Menu, Package, UserRound, X } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useLogout, useMe } from "@/hooks/useAuth";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { ChatProductAttachment } from "@/types/chat";
import type { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountSupportChatPanel from "@/components/layout/AccountSupportChatPanel";

type AccountRouteState = {
    openChat?: boolean;
    prefillProduct?: ChatProductAttachment;
};

const sidebarItems = [
    { to: "/my-account/profile", icon: UserRound, label: "Thông tin cá nhân" },
    { to: "/my-account/addresses", icon: MapPinHouse, label: "Địa chỉ của tôi" },
    { to: "/my-account/orders", icon: Package, label: "Đơn hàng của tôi" },
    { to: "/my-account/wishlists", icon: Heart, label: "Danh sách yêu thích" },
    { to: "/my-account/notifications", icon: Bell, label: "Thông báo" },
];

const AccountLayout = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [prefillProduct, setPrefillProduct] = useState<ChatProductAttachment | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { mutate: logout, isPending: isLoggingOut } = useLogout();
    const cachedUser = authStorage.getUser<User>();
    const { data } = useMe();
    const user = data?.data ?? cachedUser;
    const avatarFallback = user?.fullName?.trim().charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

    useEffect(() => {
        const state = location.state as AccountRouteState | null;
        if (!state?.openChat) {
            return;
        }

        setIsChatOpen(true);
        setPrefillProduct(state.prefillProduct ?? null);

        navigate(location.pathname + location.search, { replace: true, state: null });
    }, [location.pathname, location.search, location.state, navigate]);

    const handleLogout = () => {
        logout(undefined, {
            onSettled: () => {
                authStorage.clear();
                toast.success("Đã đăng xuất");
                navigate("/login", { replace: true });
            },
        });
    };

    const handleNavClick = () => {
        setIsChatOpen(false);
        setIsMobileSidebarOpen(false);
    };

    const sidebarContent = (
        <>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <Avatar className="size-10">
                    <AvatarImage src={user?.avatar ?? undefined} alt={user?.fullName ?? user?.email ?? "User avatar"} />
                    <AvatarFallback className="bg-primary text-sm font-bold text-white">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{user?.fullName || "Người dùng"}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email || "Cập nhật hồ sơ của bạn"}</p>
                </div>
            </div>

            <nav className="grid grid-cols-1 gap-1 p-2">
                {sidebarItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => handleNavClick()}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )
                        }
                    >
                        <item.icon className="size-4 shrink-0" />
                        {item.label}
                    </NavLink>
                ))}

                <button
                    type="button"
                    onClick={() => {
                        setIsChatOpen(true);
                        setIsMobileSidebarOpen(false);
                    }}
                    className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        isChatOpen ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                >
                    <MessageCircle className="size-4 shrink-0" />
                    Chat
                </button>

                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <LogOutIcon className="size-4 shrink-0" />
                    {isLoggingOut ? "Đang đăng xuất..." : "Logout"}
                </button>
            </nav>
        </>
    );

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Mobile header with menu button */}
            <div className="flex items-center justify-between gap-3 md:hidden">
                <h1 className="text-lg font-bold text-slate-900">Tài khoản</h1>
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100"
                    onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
                    aria-label={isMobileSidebarOpen ? "Đóng menu" : "Mở menu"}
                >
                    {isMobileSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {/* Mobile drawer sidebar */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetContent side="left" className="w-[84vw] max-w-xs overflow-y-auto p-0 md:hidden">
                    <SheetHeader className="border-b border-slate-100">
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <nav className="space-y-1 p-2">
                        {sidebarItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => handleNavClick()}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    )
                                }
                            >
                                <item.icon className="size-4 shrink-0" />
                                {item.label}
                            </NavLink>
                        ))}

                        <button
                            type="button"
                            onClick={() => {
                                setIsChatOpen(true);
                                setIsMobileSidebarOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                                isChatOpen ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                        >
                            <MessageCircle className="size-4 shrink-0" />
                            Chat
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <LogOutIcon className="size-4 shrink-0" />
                            {isLoggingOut ? "Đang đăng xuất..." : "Logout"}
                        </button>
                    </nav>
                </SheetContent>
            </Sheet>

            {/* Desktop + Content layout */}
            <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-start">
                {/* Desktop sidebar */}
                <aside className="hidden shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white md:block md:w-48 lg:w-60">
                    {sidebarContent}
                </aside>

                {/* Main content */}
                <div className="min-w-0 flex-1">
                    {isChatOpen ? <AccountSupportChatPanel prefillProduct={prefillProduct} onPrefillConsumed={() => setPrefillProduct(null)} /> : <Outlet />}
                </div>
            </div>
        </div>
    );
};

export default AccountLayout;
