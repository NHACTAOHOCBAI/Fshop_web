import { ChevronLeft, Edit, Trash2, Loader2, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useColors, useSizes } from "@/hooks/useAttributes";
import { useProductById, useDeleteProduct } from "@/hooks/useProducts";
import { useReviewSummary, useReviewsByProduct } from "@/hooks/useReviews";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate, toAlias } from "@/lib/utils";

const AdminProductDetailPage = () => {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const id = Number(productId);

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const productQuery = useProductById(id, Number.isFinite(id) && id > 0);
    const reviewsQuery = useReviewsByProduct(id, Number.isFinite(id) && id > 0);
    const reviewSummaryQuery = useReviewSummary(id, Number.isFinite(id) && id > 0);
    const colorsQuery = useColors({ page: 1, limit: 200, sortBy: "name", sortOrder: "ASC" });
    const sizesQuery = useSizes({ page: 1, limit: 200, sortBy: "sortOrder", sortOrder: "ASC" });
    const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();

    const product = productQuery.data?.data;

    const colorMap = useMemo(() => {
        const colors = colorsQuery.data?.data ?? [];
        return new Map(colors.map((color) => [color.id, color]));
    }, [colorsQuery.data?.data]);

    const sizeMap = useMemo(() => {
        const sizes = sizesQuery.data?.data ?? [];
        return new Map(sizes.map((size) => [size.id, size]));
    }, [sizesQuery.data?.data]);

    const allImages = useMemo(() => {
        if (!product) {
            return [];
        }
        const productImages = (product.images ?? []).map((image) => image.imageUrl).filter(Boolean) as string[];
        const variantImages = (product.variants ?? []).map((variant) => variant.imageUrl).filter(Boolean) as string[];
        return Array.from(new Set([...productImages, ...variantImages]));
    }, [product]);

    const colorOptions = useMemo(() => {
        const variants = product?.variants ?? [];
        const ids = Array.from(new Set(variants.map((variant) => variant.colorId)));
        return ids.map((id) => {
            const color = colorMap.get(id);
            return {
                id,
                name: color?.name ?? `Màu #${id}`,
                hexCode: color?.hexCode ?? null,
            };
        });
    }, [colorMap, product?.variants]);

    const sizeOptions = useMemo(() => {
        const variants = product?.variants ?? [];
        const ids = Array.from(new Set(variants.map((variant) => variant.sizeId)));
        return ids.map((id) => {
            const size = sizeMap.get(id);
            return {
                id,
                name: size?.name ?? `Size #${id}`,
            };
        });
    }, [product?.variants, sizeMap]);

    const selectedVariant = useMemo(() => {
        if (!product?.variants || selectedColorId === null || selectedSizeId === null) {
            return null;
        }
        return (
            product.variants.find(
                (variant) => variant.colorId === selectedColorId && variant.sizeId === selectedSizeId
            ) ?? null
        );
    }, [product, selectedColorId, selectedSizeId]);

    const totalStockQuantity = useMemo(() => {
        const variants = product?.variants ?? [];
        return variants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0);
    }, [product?.variants]);

    const totalSoldQuantity = useMemo(() => {
        if (typeof product?.soldQuantity === "number") {
            return product.soldQuantity;
        }
        const variants = product?.variants ?? [];
        return variants.reduce((sum, variant) => sum + (variant.soldQuantity ?? 0), 0);
    }, [product?.soldQuantity, product?.variants]);

    const displayedStockQuantity = selectedVariant
        ? (selectedVariant.stockQuantity ?? 0)
        : totalStockQuantity;

    const displayedSoldQuantity = selectedVariant
        ? (selectedVariant.soldQuantity ?? 0)
        : totalSoldQuantity;

    const handleDelete = () => {
        if (!id) return;
        deleteProduct(
            { id },
            {
                onSuccess: () => {
                    toast.success("Đã xóa sản phẩm");
                    setShowDeleteConfirm(false);
                    navigate("/admin/products");
                },
                onError: (error) => {
                    toast.error(`Xóa thất bại: ${error.message}`);
                },
            }
        );
    };

    const reviews = reviewsQuery.data?.data ?? [];
    const reviewSummary = reviewSummaryQuery.data?.data;
    const averageRating = Number(reviewSummary?.averageRating ?? 0);
    const reviewCount = reviewSummary?.reviewCount ?? reviews.length;
    const roundedAverageRating = Math.round(averageRating);

    if (productQuery.isLoading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#40BFFF]" />
            </div>
        );
    }

    if (productQuery.isError || !product) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Không thể tải chi tiết sản phẩm.
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
            <div>
                <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    <ChevronLeft className="size-4" />
                    Quay lại danh sách
                </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] bg-white p-6 rounded-xl border border-slate-200">
                {/* Left Column: Image Gallery */}
                <section className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                        {allImages[selectedImage] ? (
                            <img
                                src={allImages[selectedImage]}
                                alt={product.name}
                                className="h-[300px] w-full object-contain sm:h-[400px] lg:h-[500px]"
                            />
                        ) : (
                            <div className="flex h-[300px] w-full items-center justify-center text-slate-400 sm:h-[400px] lg:h-[500px]">
                                Không có ảnh
                            </div>
                        )}
                    </div>

                    {allImages.length > 1 ? (
                        <div className="grid grid-cols-5 gap-2">
                            {allImages.map((image, idx) => (
                                <button
                                    key={`${image}-${idx}`}
                                    type="button"
                                    onClick={() => setSelectedImage(idx)}
                                    className={`overflow-hidden rounded-lg border aspect-square ${idx === selectedImage ? "border-primary ring-1 ring-primary" : "border-slate-200"}`}
                                >
                                    <img src={image} alt={`${product.name}-${idx + 1}`} className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </section>

                {/* Right Column: Attributes & Actions */}
                <section className="space-y-5">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${product.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-600/25" : "bg-red-50 text-red-700 ring-red-600/25"}`}>
                                {product.isActive ? "Đang hoạt động" : "Tạm ẩn"}
                            </span>
                            <span className="text-xs text-slate-400">ID: #{product.id}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="inline-flex items-center gap-0.5 text-amber-500">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className={`size-4 ${index < roundedAverageRating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                                    />
                                ))}
                            </div>
                            <span className="font-semibold text-slate-700">{averageRating.toFixed(1)}</span>
                            <span>({reviewCount} đánh giá)</span>
                        </div>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4 border border-slate-200/60">
                        <p className="text-xs text-slate-500">Giá bán</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-4 text-sm text-slate-600">
                        <div>Thương hiệu: <span className="font-semibold text-slate-900">{product.brand?.name ?? "Đang cập nhật"}</span></div>
                        <div>Danh mục: <span className="font-semibold text-slate-900">{product.category?.name ?? "Đang cập nhật"}</span></div>
                        <div>
                            Tổng tồn kho: <span className="font-semibold text-slate-900">{displayedStockQuantity}</span>
                        </div>
                        <div>
                            Đã bán: <span className="font-semibold text-slate-900">{displayedSoldQuantity}</span>
                        </div>
                    </div>

                    {colorOptions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Màu sắc</p>
                            <div className="flex flex-wrap gap-2">
                                {colorOptions.map((colorOption) => (
                                    <button
                                        key={colorOption.id}
                                        type="button"
                                        onClick={() => setSelectedColorId((current) => (current === colorOption.id ? null : colorOption.id))}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${selectedColorId === colorOption.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-slate-200 bg-white hover:border-primary/50"}`}
                                    >
                                        <span
                                            className="size-3 rounded-full border border-black/10"
                                            style={{ backgroundColor: colorOption.hexCode ?? "#e2e8f0" }}
                                        />
                                        {colorOption.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {sizeOptions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Kích cỡ</p>
                            <div className="flex flex-wrap gap-2">
                                {sizeOptions.map((sizeOption) => (
                                    <button
                                        key={sizeOption.id}
                                        type="button"
                                        onClick={() => setSelectedSizeId((current) => (current === sizeOption.id ? null : sizeOption.id))}
                                        className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${selectedSizeId === sizeOption.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-slate-200 bg-white hover:border-primary/50"}`}
                                    >
                                        {sizeOption.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <Button
                            className="flex-1 gap-2 h-11"
                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        >
                            <Edit className="size-4" />
                            Chỉnh sửa sản phẩm
                        </Button>
                        <Button
                            variant="destructive"
                            className="gap-2 h-11"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 className="size-4" />
                            Xóa sản phẩm
                        </Button>
                    </div>
                </section>
            </div>

            {/* Description & Reviews Tabs */}
            <section className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
                        <button
                            type="button"
                            onClick={() => setActiveTab("description")}
                            className={`relative pb-3 transition-colors ${activeTab === "description" ? "text-primary font-semibold" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Mô tả chi tiết
                            {activeTab === "description" ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" /> : null}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("reviews")}
                            className={`relative pb-3 transition-colors ${activeTab === "reviews" ? "text-primary font-semibold" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Đánh giá từ khách hàng ({reviewCount})
                            {activeTab === "reviews" ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" /> : null}
                        </button>
                    </div>
                </div>

                {activeTab === "description" ? (
                    <div className="mt-5 text-sm leading-7 text-slate-600 whitespace-pre-line">
                        {product.description?.trim() || "Sản phẩm hiện chưa có mô tả chi tiết."}
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        {reviewsQuery.isLoading || reviewSummaryQuery.isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                                <Loader2 className="size-4 animate-spin text-primary" />
                                Đang tải đánh giá...
                            </div>
                        ) : reviewsQuery.isError || reviewSummaryQuery.isError ? (
                            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                                Không thể tải đánh giá sản phẩm.
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 bg-slate-50">
                                Chưa có đánh giá nào cho sản phẩm này.
                            </div>
                        ) : (
                            reviews.map((review) => {
                                const ratingValue = Math.max(0, Math.min(5, Number(review.rating) || 0));
                                const roundedRating = Math.round(ratingValue);
                                const author = review.user?.name || "Khách hàng ẩn danh";

                                return (
                                    <article key={review.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
                                                    {toAlias(author)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{author}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                                        <span>{formatDate(review.createdAt)}</span>
                                                        {review.variantName && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Phân loại: {review.variantName}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-0.5 text-amber-500">
                                                {Array.from({ length: 5 }).map((_, idx) => (
                                                    <Star
                                                        key={idx}
                                                        className={`size-3.5 ${idx < roundedRating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {review.comment ? (
                                            <p className="text-sm text-slate-600 leading-6">{review.comment}</p>
                                        ) : null}

                                        {review.images && review.images.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 max-w-lg">
                                                {review.images.map((imgUrl, imgIdx) => (
                                                    <a
                                                        key={`${review.id}-image-${imgIdx}`}
                                                        href={imgUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white"
                                                    >
                                                        <img
                                                            src={imgUrl}
                                                            alt={`review-attachment-${imgIdx + 1}`}
                                                            className="h-full w-full object-cover hover:scale-105 transition-transform"
                                                            loading="lazy"
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : null}
                                    </article>
                                );
                            })
                        )}
                    </div>
                )}
            </section>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác và sẽ xóa bỏ sản phẩm khỏi hệ thống.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                            onClick={(event) => {
                                event.preventDefault();
                                handleDelete();
                            }}
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminProductDetailPage;
