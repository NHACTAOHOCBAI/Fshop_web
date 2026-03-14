import { Bell, Heart, Package, UserRound } from "lucide-react";
import { NavLink, Outlet } from "react-router";

import { cn } from "@/lib/utils";

const sidebarItems = [
    { to: "/my-account/profile", icon: UserRound, label: "Thông tin cá nhân" },
    { to: "/my-account/orders", icon: Package, label: "Đơn hàng của tôi" },
    { to: "/my-account/wishlists", icon: Heart, label: "Danh sách yêu thích" },
    { to: "/my-account/notifications", icon: Bell, label: "Thông báo" },
];

const AccountLayout = () => {
    return (
        <div className="flex gap-6 items-start">
            {/* Sidebar */}
            <aside className="w-60 shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
                        U
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">Người dùng</p>
                        <p className="truncate text-xs text-slate-500">user@fshop.vn</p>
                    </div>
                </div>

                <nav className="p-2">
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
