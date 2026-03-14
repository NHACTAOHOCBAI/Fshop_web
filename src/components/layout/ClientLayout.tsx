import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Heart, ShoppingCart, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
    { to: "/", label: "Trang chủ" },
    { to: "/men", label: "Nam" },
    { to: "/women", label: "Nữ" },
    { to: "/kids", label: "Trẻ em" },
];

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

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3  border-slate-100 px-4 py-1 md:px-8">
                    <div className="flex items-center gap-2 text-slate-500">
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
                    <Link to="/men" className="inline-flex items-center gap-2">
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
            <div className="bg-gray-100 py-3.5">
                <div className="px-4  md:px-8 mx-auto max-w-6xl text-sm text-slate-500">
                    <span>Fshop</span>
                    <span className="mx-2">/</span>
                    <span className="text-primary">{breadcrumbDepartmentLabel}</span>
                </div>
            </div>
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
