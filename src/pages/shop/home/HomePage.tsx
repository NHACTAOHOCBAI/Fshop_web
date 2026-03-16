import { ArrowRight, BadgePercent, ShieldCheck, Sparkles, Tag, Truck, Zap } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import type { DepartmentType } from "@/types/category";
import ProductCard from "@/pages/shop/products/components/ProductCard";

const COLLECTIONS: {
    id: DepartmentType;
    title: string;
    subtitle: string;
    gradient: string;
}[] = [
        {
            id: "men",
            title: "Nam",
            subtitle: "Phong cách lịch lãm, hiện đại",
            gradient: "from-slate-800 to-slate-950",
        },
        {
            id: "women",
            title: "Nữ",
            subtitle: "Tinh tế, thanh lịch mỗi ngày",
            gradient: "from-rose-400 to-rose-600",
        },
        {
            id: "kids",
            title: "Trẻ em",
            subtitle: "Năng động, thoải mái và an toàn",
            gradient: "from-sky-400 to-cyan-600",
        },
    ];

const BENEFITS = [
    { icon: Truck, title: "Freeship toàn quốc", desc: "Đơn từ 299.000đ" },
    { icon: Zap, title: "Giao nhanh", desc: "Nhận hàng 2-3 ngày" },
    { icon: ShieldCheck, title: "Đổi trả 30 ngày", desc: "Yên tâm mua sắm" },
    { icon: Sparkles, title: "Hàng chính hãng", desc: "Cam kết chất lượng" },
];

const PROMOS = [
    {
        title: "Sale cuối mùa",
        desc: "Giảm đến 50% toàn bộ BST hè",
        to: "/women",
        bg: "from-orange-400 to-red-500",
    },
    {
        title: "Ưu đãi thành viên mới",
        desc: "Giảm thêm 10% cho đơn đầu tiên",
        to: "/men",
        bg: "from-emerald-400 to-teal-500",
    },
    {
        title: "Deal cuối tuần",
        desc: "Flash sale số lượng giới hạn",
        to: "/kids",
        bg: "from-indigo-400 to-blue-600",
    },
];

const HomePage = () => {
    const brandsQuery = useBrands({ page: 1, limit: 18, sortBy: "name", sortOrder: "ASC" });
    const categoriesQuery = useCategories({ page: 1, limit: 60, sortBy: "name", sortOrder: "ASC" });
    const productsQuery = useProducts({ page: 1, limit: 12, sortBy: "createdAt", sortOrder: "DESC" });

    const brands = brandsQuery.data?.data ?? [];
    const categories = categoriesQuery.data?.data ?? [];
    const products = productsQuery.data?.data ?? [];

    const categoriesByDepartment = COLLECTIONS.map((collection) => ({
        department: collection.id,
        title: collection.title,
        items: categories.filter((category) => category.department === collection.id),
    }));

    return (
        <div className="space-y-14">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-sky-600 px-6 py-16 text-white md:px-10 md:py-24">
                <div className="absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="relative max-w-3xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="size-3.5 text-amber-200" />
                        New Season 2026
                    </span>
                    <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
                        Landing Page FShop
                        <br />
                        Dành cho thời trang hiện đại
                    </h1>
                    <p className="mt-4 max-w-xl text-sm text-white/85 md:text-base">
                        Mua sắm nhanh, đẹp, đầy đủ từ Nam, Nữ, Trẻ em đến danh mục, thương hiệu và các sản phẩm mới nhất.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90">
                            <Link to="/men">
                                Mua ngay <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="rounded-full border-white/50 bg-white/10 text-white hover:bg-white/20">
                            <Link to="/women">Khám phá bộ sưu tập</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
                        <p className="mt-1 text-xs text-slate-500">{desc}</p>
                    </div>
                ))}
            </section>

            <section>
                <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Bộ sưu tập</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Nam, Nữ và Trẻ em</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {COLLECTIONS.map((collection) => (
                        <Link
                            key={collection.id}
                            to={`/${collection.id}`}
                            className={cn(
                                "group relative min-h-44 overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white transition-transform hover:-translate-y-1 hover:shadow-lg",
                                collection.gradient,
                            )}
                        >
                            <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
                            <div className="relative">
                                <p className="text-xs uppercase tracking-wider text-white/75">Bộ sưu tập</p>
                                <p className="mt-2 text-2xl font-extrabold">{collection.title}</p>
                                <p className="mt-2 text-sm text-white/85">{collection.subtitle}</p>
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                                    Xem ngay <ArrowRight className="size-3.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                {PROMOS.map((promo) => (
                    <Link
                        key={promo.title}
                        to={promo.to}
                        className={cn("rounded-2xl bg-gradient-to-r p-5 text-white shadow-sm transition-transform hover:-translate-y-0.5", promo.bg)}
                    >
                        <BadgePercent className="size-5" />
                        <p className="mt-3 text-lg font-bold">{promo.title}</p>
                        <p className="mt-1 text-sm text-white/85">{promo.desc}</p>
                    </Link>
                ))}
            </section>

            <section>
                <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Danh mục</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Danh mục theo từng nhóm</h2>
                </div>
                {categoriesQuery.isLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có danh mục để hiển thị.</p>
                ) : (
                    <div className="space-y-5">
                        {categoriesByDepartment.map((group) => (
                            <div key={group.department} className="rounded-2xl border border-slate-200 p-4">
                                <p className="mb-3 text-sm font-semibold text-slate-800">{group.title}</p>
                                <div className="flex flex-wrap gap-2">
                                    {group.items.length === 0 ? (
                                        <span className="text-xs text-slate-400">Chưa có danh mục</span>
                                    ) : (
                                        group.items.map((category) => (
                                            <Link
                                                key={category.id}
                                                to={`/${group.department}`}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-primary/40 hover:text-primary"
                                            >
                                                <Tag className="size-3 text-primary/70" />
                                                {category.name}
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Thương hiệu</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Brand nổi bật</h2>
                </div>
                {brandsQuery.isLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : brands.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có thương hiệu để hiển thị.</p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-6">
                        {brands.map((brand) => (
                            <div key={brand.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                {brand.imageUrl ? (
                                    <img src={brand.imageUrl} alt={brand.name} className="h-8 w-8 rounded-md object-cover" />
                                ) : (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                                        {brand.name[0]}
                                    </span>
                                )}
                                <span className="line-clamp-1 text-sm font-semibold text-slate-700">{brand.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sản phẩm</p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">Sản phẩm mới nhất</h2>
                    </div>
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link to="/men">Xem thêm</Link>
                    </Button>
                </div>
                {productsQuery.isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có sản phẩm để hiển thị.</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        {products.map((product) => {
                            const department = product.category?.department ?? "men";
                            return (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    department={department}
                                    brandName={product.brand?.name ?? "FShop"}
                                />
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default HomePage;
