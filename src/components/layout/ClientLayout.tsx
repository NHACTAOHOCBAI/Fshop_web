import { Link, NavLink, Outlet } from "react-router";
import { Heart, ShoppingCart, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
    { to: "/", label: "Home" },
    { to: "/men", label: "Man" },
    { to: "/women", label: "Woman" },
    { to: "/kids", label: "Kid" },
];

const ClientLayout = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3  border-slate-100 px-4 py-1 md:px-8">
                    <div className="flex items-center gap-2 text-slate-500">
                        <button type="button" className="rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
                            <Heart className="size-4" />
                        </button>
                        <button type="button" className="rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
                            <ShoppingCart className="size-4" />
                        </button>
                        <button type="button" className="rounded-md p-2 transition-colors hover:bg-slate-100 hover:text-primary">
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
                    <span>Shop</span>
                    <span className="mx-2">/</span>
                    <span className="text-primary">Shoes</span>
                </div>
            </div>
            <main className=" mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
                <Outlet />
            </main>

            <footer className="mt-12 bg-primary/35">
                <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm text-slate-700 md:grid-cols-3 md:px-8">
                    <div>
                        <p className="font-semibold text-slate-900">FShop</p>
                        <p className="mt-2">Nen tang ban hang thoi trang online voi trai nghiem nhanh va on dinh.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Follow Us</p>
                        <p className="mt-2">Cap nhat xu huong va bo suu tap moi moi tuan.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900">Contact</p>
                        <p className="mt-2">E-Comm, Thu Duc, Ho Chi Minh City</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ClientLayout;
