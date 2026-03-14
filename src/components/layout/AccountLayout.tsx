import { Bell, Heart, MapPinHouse, Package, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router";

import { useMe } from "@/hooks/useAuth";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sidebarItems = [
    { to: "/my-account/profile", icon: UserRound, label: "Thông tin cá nhân" },
    { to: "/my-account/addresses", icon: MapPinHouse, label: "Địa chỉ của tôi" },
    { to: "/my-account/orders", icon: Package, label: "Đơn hàng của tôi" },
    { to: "/my-account/wishlists", icon: Heart, label: "Danh sách yêu thích" },
    { to: "/my-account/notifications", icon: Bell, label: "Thông báo" },
];

const AccountLayout = () => {
    const cachedUser = authStorage.getUser<User>();
    const { data } = useMe();
    const user = data?.data ?? cachedUser;
    const avatarFallback = user?.fullName?.trim().charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

    return (
        <div className="flex gap-6 items-start">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden">
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

                <nav className="p-2 flex flex-col gap-1">
                    {sidebarItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
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
                </nav>
            </aside>

            {/* Main content */}
            <div className="min-w-0 flex-1">
                <Outlet />
            </div>
        </div>
    );
};

export default AccountLayout;
