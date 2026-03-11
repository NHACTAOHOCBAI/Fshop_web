import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useShopCatalog, type ShopCatalogProduct, type ShopSortOption } from "@/hooks/useShopCatalog";

const sortOptions: { value: ShopSortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "name-asc", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" },
];

const departmentLabelMap = {
    men: "Man",
    women: "Woman",
    kids: "Kid",
} as const;

const getProductImage = (product: ShopCatalogProduct) => {
    const imageUrl = product.images?.[0]?.imageUrl;
    if (!imageUrl) {
        return "https://placehold.co/600x420/e5e7eb/64748b?text=No+Image";
    }

    return imageUrl;
};

const getProductPrice = (product: ShopCatalogProduct) => {
    if (!product.variants || product.variants.length === 0) {
        return "Contact";
    }

    const minPrice = Math.min(...product.variants.map((variant) => variant.price));
    return `$${minPrice.toFixed(2)}`;
};

const buildPaginationItems = (currentPage: number, totalPages: number) => {
    const pages = new Set<number>();
    pages.add(1);
    pages.add(totalPages);

    for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        if (page > 1 && page < totalPages) {
            pages.add(page);
        }
    }

    return Array.from(pages).sort((a, b) => a - b);
};

type FilterItem = {
    id: number;
    name: string;
};

type FilterPanelProps = {
    title: string;
    name: string;
    items: FilterItem[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onClear: () => void;
};

const FilterPanel = ({ title, name, items, selectedId, onSelect, onClear }: FilterPanelProps) => {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold tracking-[0.18em] text-slate-600 uppercase">{title}</h3>
                <button type="button" onClick={onClear} className="text-xs font-medium text-primary hover:underline">
                    Clear
                </button>
            </div>

            {items.length === 0 ? <p className="text-sm text-slate-400">No data</p> : null}

            <div className="space-y-2 text-sm">
                {items.map((item) => (
                    <label key={item.id} className="flex cursor-pointer items-center gap-2 text-slate-700">
                        <input
                            type="radio"
                            name={name}
                            checked={selectedId === item.id}
                            onChange={() => onSelect(item.id)}
                        />
                        <span>{item.name}</span>
                    </label>
                ))}
            </div>
        </section>
    );
};

const ProductCard = ({ product }: { product: ShopCatalogProduct }) => {
    return (
        <article className="group rounded-2xl border border-slate-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_24px_-16px_rgba(14,165,233,0.6)]">
            <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-slate-100">
                <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                />
                <span className="absolute left-2 top-2 rounded-md bg-app-secondary px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                    New
                </span>
            </div>

            <div className="pt-3">
                <p className="line-clamp-2 text-sm font-medium text-slate-800">{product.name}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">{product.brand?.name ?? "Brand"}</span>
                    <span className="font-semibold text-primary">{getProductPrice(product)}</span>
                </div>
            </div>
        </article>
    );
};

const ShopCatalogPage = () => {
    const params = useParams<{ department?: string }>();
    const department = useMemo(() => {
        const rawDepartment = params.department?.toLowerCase();
        if (rawDepartment === "men" || rawDepartment === "women" || rawDepartment === "kids") {
            return rawDepartment;
        }

        return "men";
    }, [params.department]);

    const departmentLabel = departmentLabelMap[department];

    const {
        page,
        totalPages,
        totalItems,
        searchInput,
        sortOption,
        selectedCategoryId,
        selectedBrandId,
        products,
        categories,
        brands,
        isLoading,
        isFetching,
        isError,
        errorMessage,
        updatePage,
        onSearchChange,
        onSortChange,
        onCategoryChange,
        onBrandChange,
        clearFilters,
    } = useShopCatalog();

    const pageItems = buildPaginationItems(page, totalPages);

    return (

        <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
            <aside className="space-y-4">
                <FilterPanel
                    title="Categories"
                    name="category"
                    items={categories}
                    selectedId={selectedCategoryId}
                    onSelect={onCategoryChange}
                    onClear={() => onCategoryChange(null)}
                />

                <FilterPanel
                    title="Brands"
                    name="brand"
                    items={brands}
                    selectedId={selectedBrandId}
                    onSelect={onBrandChange}
                    onClear={() => onBrandChange(null)}
                />

                <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                    <SlidersHorizontal className="size-4" />
                    Reset filters
                </Button>
            </aside>

            <section className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                            <Input
                                value={searchInput}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder="Search products..."
                                className="p-5 rounded-[24px]"
                            />
                            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        </div>

                        <Select value={sortOption} onValueChange={(value) => onSortChange(value as ShopSortOption)}>
                            <SelectTrigger className="w-full md:w-45">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                        <span className="font-semibold text-primary">{totalItems}</span> items found
                        {isFetching ? " (updating...)" : ""}
                    </p>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-r from-primary/95 via-primary/85 to-cyan-400 p-5 text-white md:p-6">
                    <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
                    <p className="relative text-xs font-semibold tracking-[0.18em] text-sky-100 uppercase">Department</p>
                    <h2 className="relative mt-1 text-xl font-semibold md:text-2xl">{departmentLabel}&apos;s Shoes</h2>
                    <p className="relative mt-2 max-w-xl text-sm text-sky-50">
                        Showing products for <span className="font-semibold text-white">{departmentLabel}</span> department.
                    </p>
                </div>

                {isError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {errorMessage ?? "Cannot load products."}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-67.5 animate-pulse rounded-2xl bg-slate-200" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {products.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                                No products matched your filters.
                            </div>
                        ) : null}
                    </>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Button variant="outline" size="icon-sm" onClick={() => updatePage(page - 1)} disabled={page <= 1}>
                        <ChevronLeft className="size-4" />
                    </Button>

                    {pageItems.map((item, index) => {
                        const previous = pageItems[index - 1];
                        const shouldRenderEllipsis = previous !== undefined && item - previous > 1;

                        return (
                            <div key={item} className="flex items-center gap-2">
                                {shouldRenderEllipsis ? <span className="px-1 text-slate-400">...</span> : null}
                                <Button
                                    variant={item === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updatePage(item)}
                                    className={item === page ? "bg-primary text-white" : ""}
                                >
                                    {item}
                                </Button>
                            </div>
                        );
                    })}

                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updatePage(page + 1)}
                        disabled={page >= totalPages}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default ShopCatalogPage;
