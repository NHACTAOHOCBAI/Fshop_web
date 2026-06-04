import { ArrowRight, Camera, Compass, MessageCircle, Mic, Sparkles, Tag } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import type { DepartmentType } from "@/types/category";
import ProductCard from "@/pages/shop/products/components/ProductCard";
import { usePersonalizedRecommendations } from "@/hooks/useRecommendations";


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
            gradient: "from-[#40BFFF] to-[#2E93E8]",
        },
        {
            id: "women",
            title: "Nữ",
            subtitle: "Tinh tế, thanh lịch mỗi ngày",
            gradient: "from-[#40BFFF] to-[#1E88E5]",
        },
        {
            id: "kids",
            title: "Trẻ em",
            subtitle: "Năng động, thoải mái và an toàn",
            gradient: "from-[#40BFFF] to-[#27A3FF]",
        },
    ];

const AI_FEATURES = [
    {
        icon: MessageCircle,
        title: "Chatbot hỗ trợ nhanh",
        desc: "Hỏi đáp về đơn hàng, sản phẩm và hỗ trợ mua sắm ngay trong web.",
    },
    {
        icon: Camera,
        title: "Tìm kiếm bằng hình ảnh",
        desc: "Tải ảnh lên để tìm sản phẩm gần giống hoặc đúng mẫu bạn cần.",
    },
    {
        icon: Mic,
        title: "Tìm kiếm bằng giọng nói",
        desc: "Nói tự nhiên, hệ thống sẽ tự hiểu và trả về sản phẩm phù hợp.",
    },
];

const HERO_STATS = [
    { label: "Đơn giao thành công", value: "120K+" },
    { label: "Khách hàng quay lại", value: "86%" },
    { label: "Bộ sưu tập đang bán", value: "240+" },
];

const splitIntoRows = <T,>(items: T[]) => {
    const midpoint = Math.ceil(items.length / 2);
    return [items.slice(0, midpoint), items.slice(midpoint)];
};

const HomePage = () => {
    const brandsQuery = useBrands({ page: 1, limit: 18, sortBy: "name", sortOrder: "ASC" });
    const categoriesQuery = useCategories({ page: 1, limit: 60, sortBy: "name", sortOrder: "ASC" });
    const productsQuery = useProducts({ page: 1, limit: 12, sortBy: "createdAt", sortOrder: "DESC" });
    const personalizedQuery = usePersonalizedRecommendations(100);

    const brands = brandsQuery.data?.data ?? [];
    const categories = categoriesQuery.data?.data ?? [];
    const products = productsQuery.data?.data ?? [];
    const [brandRowOne, brandRowTwo] = splitIntoRows(brands);

    const renderBrandRow = (items: typeof brands, directionClassName: string) => {
        const duplicatedItems = [...items, ...items];

        return (
            <div className={cn("flex w-max gap-3 px-2", directionClassName)}>
                {duplicatedItems.map((brand, index) => (
                    <div
                        key={`${brand.id}-${index}`}
                        className="flex h-14 w-44 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
                    >
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
        );
    };

    const categoriesByDepartment = COLLECTIONS.map((collection) => ({
        department: collection.id,
        title: collection.title,
        items: categories.filter((category) => category.department === collection.id),
    }));

    return (
        <div className="space-y-16 pb-4">
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#40BFFF] to-[#1E88E5] px-6 py-10 text-white transition-all duration-500 hover:-translate-y-0.5 hover:shadow-2xl md:px-10 md:py-14">

                <div className="relative grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                            <Sparkles className="size-3.5 text-amber-300" />
                            New Drop 2026
                        </span>

                        <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
                            Phong cách mới.
                            <br />
                            Chọn nhanh.
                            <br />
                            Mặc chất.
                        </h1>

                        <p className="mt-4 max-w-xl text-sm text-sky-100/90 md:text-base">
                            FShop gom bộ sưu tập Nam, Nữ, Trẻ em với trải nghiệm tìm kiếm nhanh, sản phẩm cập nhật liên tục và ưu đãi theo mùa.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <Button asChild size="lg" className="group relative overflow-hidden rounded-full border border-white/40 bg-[linear-gradient(135deg,#ffffff_0%,#f3faff_100%)] text-[#40BFFF] shadow-lg shadow-blue-500/15 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-[linear-gradient(135deg,#ffffff_0%,#e8f6ff_100%)] hover:shadow-xl hover:shadow-blue-500/25 active:translate-y-0">
                                <Link to="/men">
                                    <span className="relative inline-flex items-center gap-1 font-semibold">
                                        Mua ngay <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/20 bg-white/10 p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-100/85">Nhịp mua sắm</p>
                        <div className="mt-3 space-y-2">
                            {HERO_STATS.map((stat) => (
                                <div key={stat.label} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5">
                                    <span className="text-xs text-sky-100/85">{stat.label}</span>
                                    <span className="text-lg font-bold text-white">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                        <Link
                            to="/community"
                            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white/90 transition hover:text-white"
                        >
                            <Compass className="size-4" />
                            Khám phá cộng đồng
                        </Link>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
                <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary">AI trên FShop</p>
                        <h2 className="mt-1 text-2xl font-bold text-slate-900">Mua sắm thông minh hơn</h2>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {AI_FEATURES.map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-white hover:shadow-lg"
                        >
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Icon className="size-5" />
                            </span>
                            <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-slate-600">
                    Chatbot, tìm kiếm hình ảnh và giọng nói được thiết kế để rút ngắn thời gian tìm sản phẩm, đặc biệt trên mobile.
                </div>
            </section>

            {/* Personalized Recommendations Section */}
            {!personalizedQuery.isLoading && personalizedQuery.data?.data && personalizedQuery.data.data.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Dành riêng cho bạn</p>
                            <h2 className="mt-1 text-2xl font-bold text-slate-900">Gợi ý dựa trên sở thích</h2>
                        </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        {personalizedQuery.data.data.map((product) => {
                            const department = (product.category?.department as DepartmentType) ?? "men";
                            return (
                                <div key={product.id} className="transition-transform duration-300 hover:-translate-y-1">
                                    <ProductCard
                                        product={product}
                                        department={department}
                                        brandName={product.brand?.name ?? "FShop"}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}


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
                                "group relative min-h-44 overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                                collection.gradient,
                            )}
                        >
                            <div className="absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/30" />
                            <div className="relative">
                                <p className="text-xs uppercase tracking-wider text-white/75">Danh mục</p>
                                <p className="mt-2 text-2xl font-extrabold">{collection.title}</p>
                                <p className="mt-2 text-sm text-white/85">{collection.subtitle}</p>
                                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white/90 transition-transform duration-300 group-hover:translate-x-0.5">
                                    Xem ngay <ArrowRight className="size-3.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
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
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-300 hover:border-primary/20 hover:bg-white hover:shadow-md" key={group.department}>
                                <p className="mb-3 text-sm font-semibold text-slate-800">{group.title}</p>
                                <div className="flex flex-wrap gap-2">
                                    {group.items.length === 0 ? (
                                        <span className="text-xs text-slate-400">Chưa có danh mục</span>
                                    ) : (
                                        group.items.map((category) => (
                                            <Link
                                                key={category.id}
                                                to={`/${group.department}`}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-sm"
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

            <section className="rounded-3xl border border-slate-200 bg-white overflow-hidden pb-4">
                <div className=" p-4 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">Thương hiệu</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Brand nổi bật</h2>
                </div>
                {brandsQuery.isLoading ? (
                    <div className="space-y-3 overflow-hidden">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                        ))}
                    </div>
                ) : brands.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có thương hiệu để hiển thị.</p>
                ) : (
                    <div className="space-y-3 overflow-hidden">
                        <div className="group overflow-hidden">
                            {renderBrandRow(brandRowOne.length > 0 ? brandRowOne : brands, "animate-marquee-left")}
                        </div>
                        <div className="group overflow-hidden">
                            {renderBrandRow(brandRowTwo.length > 0 ? brandRowTwo : brands, "animate-marquee-left [animation-direction:reverse]")}
                        </div>
                    </div>
                )}
            </section>

            <section>
                <div className="mb-5 flex items-end justify-between gap-3">
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
                                <div key={product.id} className="transition-transform duration-300 hover:-translate-y-1">
                                    <ProductCard
                                        product={product}
                                        department={department}
                                        brandName={product.brand?.name ?? "FShop"}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default HomePage;
