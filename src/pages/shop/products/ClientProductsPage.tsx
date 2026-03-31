import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Camera, Mic } from "lucide-react";
import { useMemo, useState } from "react";
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
import { ImageSearchDialog } from "@/components/image-search-dialog";
import { VoiceSearchDialog } from "@/components/voice-search-dialog";
import { useShopCatalog, type ShopSortOption } from "@/hooks/useShopCatalog";
import { buildPaginationItems } from "@/lib/utils";
import type { DepartmentType } from "@/types/category";
import type { ImageSearchResult, Product, VoiceSearchResponse } from "@/types/product";
import { getProductById } from "@/services/products";
import ProductCard from "./components/ProductCard";

const sortOptions: { value: ShopSortOption; label: string }[] = [
    { value: "newest", label: "Mới nhất" },
    { value: "oldest", label: "Cũ nhất" },
    { value: "name-asc", label: "Tên A-Z" },
    { value: "name-desc", label: "Tên Z-A" },
];

const departmentLabelMap = {
    men: "Nam",
    women: "Nữ",
    kids: "Trẻ em",
} as const;

const departmentList: DepartmentType[] = ["men", "women", "kids"];

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
                    Xóa
                </button>
            </div>

            {items.length === 0 ? <p className="text-sm text-slate-400">Không có dữ liệu</p> : null}

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


const ClientProductsPage = () => {
    const params = useParams<{ department?: string }>();
    const [isImageSearchDialogOpen, setIsImageSearchDialogOpen] = useState(false);
    const [isVoiceSearchDialogOpen, setIsVoiceSearchDialogOpen] = useState(false);
    const [imageSearchProducts, setImageSearchProducts] = useState<Product[]>([]);
    const [voiceSearchProducts, setVoiceSearchProducts] = useState<Product[]>([]);
    const [voiceTranscription, setVoiceTranscription] = useState("");
    const [isLoadingImageResults, setIsLoadingImageResults] = useState(false);
    const [isLoadingVoiceResults, setIsLoadingVoiceResults] = useState(false);

    const department = useMemo<DepartmentType>(() => {
        const rawDepartment = params.department?.toLowerCase();
        if (rawDepartment && departmentList.includes(rawDepartment as DepartmentType)) {
            return rawDepartment as DepartmentType;
        }

        return "men";
    }, [params.department]);

    const departmentLabel = departmentLabelMap[department];

    const {
        page,
        totalPages,
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
    } = useShopCatalog(department);

    const pageItems = buildPaginationItems(page, totalPages);

    const hydrateProductsFromHits = async (results: ImageSearchResult[]) => {
        const productPromises = results.map((result) =>
            getProductById(result.product_id)
                .then((response) => response.data)
                .catch(() => null)
        );

        const productDetails = await Promise.all(productPromises);
        return productDetails.filter((product): product is Product => product !== null);
    };

    const handleImageSearchSuccess = async (results: ImageSearchResult[]) => {
        setIsLoadingImageResults(true);
        try {
            const productDetails = await hydrateProductsFromHits(results);
            setImageSearchProducts(productDetails);
            setVoiceSearchProducts([]);
            setVoiceTranscription("");
        } catch (error) {
            console.error("Failed to fetch image search product details:", error);
        } finally {
            setIsLoadingImageResults(false);
        }
    };

    const handleVoiceSearchSuccess = async (payload: VoiceSearchResponse) => {
        setIsLoadingVoiceResults(true);
        try {
            const productDetails = await hydrateProductsFromHits(payload.products);
            setVoiceSearchProducts(productDetails);
            setVoiceTranscription(payload.transcribed_text);
            setImageSearchProducts([]);

            if (payload.transcribed_text) {
                onSearchChange(payload.transcribed_text);
            }
        } catch (error) {
            console.error("Failed to fetch voice search product details:", error);
        } finally {
            setIsLoadingVoiceResults(false);
        }
    };

    const handleClearImageSearch = () => {
        setImageSearchProducts([]);
        setVoiceSearchProducts([]);
        setVoiceTranscription("");
    };

    const hasVoiceResults = voiceSearchProducts.length > 0;
    const hasImageResults = imageSearchProducts.length > 0;
    const isShowingAiResults = hasVoiceResults || hasImageResults;

    const displayProducts = hasVoiceResults
        ? voiceSearchProducts
        : hasImageResults
            ? imageSearchProducts
            : products;
    const displayTotalItems = displayProducts.length;

    return (

        <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
            <aside className="space-y-4">
                <FilterPanel
                    title="Danh mục"
                    name="category"
                    items={categories}
                    selectedId={selectedCategoryId}
                    onSelect={onCategoryChange}
                    onClear={() => onCategoryChange(null)}
                />

                <FilterPanel
                    title="Thương hiệu"
                    name="brand"
                    items={brands}
                    selectedId={selectedBrandId}
                    onSelect={onBrandChange}
                    onClear={() => onBrandChange(null)}
                />

                <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                    <SlidersHorizontal className="size-4" />
                    Đặt lại bộ lọc
                </Button>
            </aside>

            <section className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="relative w-full md:max-w-sm">
                            <Input
                                value={searchInput}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder="Tìm kiếm sản phẩm..."
                                className="p-5 rounded-[24px] pl-23 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setIsImageSearchDialogOpen(true)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                                title="Tìm kiếm bằng hình ảnh"
                            >
                                <Camera className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsVoiceSearchDialogOpen(true)}
                                className="absolute left-12 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                                title="Tìm kiếm bằng giọng nói"
                            >
                                <Mic className="size-4" />
                            </button>
                            <div className="pointer-events-none absolute right-4 top-1/2 flex gap-2 -translate-y-1/2">
                                <Search className="size-4 text-slate-400" />
                            </div>
                        </div>

                        <Select value={sortOption} onValueChange={(value) => onSortChange(value as ShopSortOption)}>
                            <SelectTrigger className="w-full md:w-45">
                                <SelectValue placeholder="Sắp xếp theo" />
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

                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Tìm thấy <span className="font-semibold text-primary">{displayTotalItems}</span> sản phẩm
                            {isFetching && !isShowingAiResults ? " (đang cập nhật...)" : ""}
                            {isLoadingImageResults ? " (đang tải...)" : ""}
                            {isLoadingVoiceResults ? " (đang xử lý giọng nói...)" : ""}
                        </p>
                        {isShowingAiResults && (
                            <button
                                type="button"
                                onClick={handleClearImageSearch}
                                className="text-xs font-medium text-primary hover:underline"
                            >
                                Xóa kết quả tìm kiếm AI
                            </button>
                        )}
                    </div>
                    {voiceTranscription ? (
                        <p className="mt-2 text-xs text-slate-500">
                            Bạn vừa nói: <span className="font-medium text-slate-700">"{voiceTranscription}"</span>
                        </p>
                    ) : null}
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-r from-primary/95 via-primary/85 to-cyan-400 p-5 text-white md:p-6">
                    <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
                    <p className="relative text-xs font-semibold tracking-[0.18em] text-sky-100 uppercase">Danh mục theo đối tượng</p>
                    <h2 className="relative mt-1 text-xl font-semibold md:text-2xl">Giày {departmentLabel}</h2>
                    <p className="relative mt-2 max-w-xl text-sm text-sky-50">
                        Đang hiển thị sản phẩm thuộc nhóm <span className="font-semibold text-white">{departmentLabel}</span>.
                    </p>
                </div>

                {isError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {errorMessage ?? "Không thể tải danh sách sản phẩm."}
                    </div>
                ) : null}

                {isLoading || isLoadingImageResults || isLoadingVoiceResults ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-67.5 animate-pulse rounded-2xl bg-slate-200" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {displayProducts.map((product) => (
                                <ProductCard key={product.id} product={product} department={department} />
                            ))}
                        </div>

                        {displayProducts.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                                {isShowingAiResults
                                    ? "Không tìm thấy sản phẩm phù hợp từ tìm kiếm AI."
                                    : "Không có sản phẩm phù hợp với bộ lọc hiện tại."}
                            </div>
                        ) : null}
                    </>
                )}

                {!isShowingAiResults && (
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
                )}
            </section>

            <ImageSearchDialog
                open={isImageSearchDialogOpen}
                onOpenChange={setIsImageSearchDialogOpen}
                onSuccess={handleImageSearchSuccess}
            />
            <VoiceSearchDialog
                open={isVoiceSearchDialogOpen}
                onOpenChange={setIsVoiceSearchDialogOpen}
                onSuccess={handleVoiceSearchSuccess}
            />
        </div>
    );
};

export default ClientProductsPage;
