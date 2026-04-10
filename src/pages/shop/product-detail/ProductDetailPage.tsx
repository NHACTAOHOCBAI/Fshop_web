import { ChevronLeft, Heart, Loader2, MessageCircle, ShoppingCart, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import QuantityStepper from "@/components/ui/quantity-stepper";
import { useColors, useSizes } from "@/hooks/useAttributes";
import { useAddToCart } from "@/hooks/useCart";
import { useProductById, useRelatedProducts } from "@/hooks/useProducts";
import { useReviewSummary, useReviewsByProduct } from "@/hooks/useReviews";
import { useToggleWishlist, useWishlists } from "@/hooks/useWishlists";
import { extractApiErrorMessage } from "@/lib/api-error";
import { authStorage } from "@/lib/auth";
import { formatCurrency, formatDate, toAlias } from "@/lib/utils";
import type { DepartmentType } from "@/types/category";
import ProductCard from "../products/components/ProductCard";

const departmentList: DepartmentType[] = ["men", "women", "kids"];

const ProductDetailPage = () => {
    const navigate = useNavigate();
    const params = useParams<{ department?: string; productId?: string }>();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");
    const [isSendingToAdmin, setIsSendingToAdmin] = useState(false);

    const department = useMemo<DepartmentType>(() => {
        const rawDepartment = params.department?.toLowerCase();
        if (rawDepartment && departmentList.includes(rawDepartment as DepartmentType)) {
            return rawDepartment as DepartmentType;
        }

        return "men";
    }, [params.department]);

    const productId = Number(params.productId);
    const productQuery = useProductById(productId, Number.isFinite(productId));
    const reviewsQuery = useReviewsByProduct(productId, Number.isFinite(productId) && productId > 0);
    const reviewSummaryQuery = useReviewSummary(productId, Number.isFinite(productId) && productId > 0);
    const colorsQuery = useColors({ page: 1, limit: 200, sortBy: "name", sortOrder: "ASC" });
    const sizesQuery = useSizes({ page: 1, limit: 200, sortBy: "sortOrder", sortOrder: "ASC" });
    const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
    const { data: wishlistData } = useWishlists();
    const { mutate: toggleWishlist, isPending: isTogglingWishlist } = useToggleWishlist();
    const product = productQuery.data?.data;
    const hasToken = Boolean(authStorage.getAccessToken());

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

    const canAddToCart = selectedColorId !== null && selectedSizeId !== null;

    const selectedCartVariant = useMemo(() => {
        if (!product?.variants || selectedColorId === null || selectedSizeId === null) {
            return null;
        }

        return (
            product.variants.find(
                (variant) => variant.colorId === selectedColorId && variant.sizeId === selectedSizeId
            ) ?? null
        );
    }, [product?.variants, selectedColorId, selectedSizeId]);

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

    const displayedStockQuantity = selectedCartVariant
        ? (selectedCartVariant.stockQuantity ?? 0)
        : totalStockQuantity;

    const displayedSoldQuantity = selectedCartVariant
        ? (selectedCartVariant.soldQuantity ?? 0)
        : totalSoldQuantity;

    const hasStock = selectedCartVariant ? (selectedCartVariant.stockQuantity ?? 0) > 0 : true;

    const handleAddToCart = () => {
        if (!canAddToCart || !selectedCartVariant) {
            toast.error("Vui lòng chọn đúng màu sắc và kích cỡ");
            return;
        }

        addToCart(
            {
                variantId: selectedCartVariant.id,
                quantity,
            },
            {
                onSuccess: () => {
                    toast.success("Đã thêm sản phẩm vào giỏ hàng");
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Không thể thêm vào giỏ hàng"));
                },
            }
        );
    };

    const reviews = reviewsQuery.data?.data ?? [];
    const reviewSummary = reviewSummaryQuery.data?.data;
    const averageRating = Number(reviewSummary?.averageRating ?? 0);
    const reviewCount = reviewSummary?.reviewCount ?? reviews.length;
    const roundedAverageRating = Math.round(averageRating);

    const { relatedProducts, isLoading: isRelatedLoading } = useRelatedProducts(product?.categoryId, product?.id);

    const isInWishlist = useMemo(() => {
        const wishlists = wishlistData?.data ?? [];
        return wishlists.some((item) => item.product?.id === product?.id);
    }, [product?.id, wishlistData?.data]);

    const handleToggleWishlist = () => {
        if (!product) {
            return;
        }

        if (!hasToken) {
            toast.error("Vui lòng đăng nhập để sử dụng danh sách yêu thích");
            return;
        }

        const wasInWishlist = isInWishlist;

        toggleWishlist(
            { productId: product.id },
            {
                onSuccess: () => {
                    toast.success(wasInWishlist ? "Đã xóa khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích");
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Không thể cập nhật danh sách yêu thích"));
                },
            }
        );
    };

    const handleSendProductToAdmin = () => {
        if (!product) {
            return;
        }

        if (!hasToken) {
            return;
        }

        setIsSendingToAdmin(true);

        navigate("/my-account/support", {
            state: {
                openChat: true,
                prefillProduct: {
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    imageUrl: product.images?.[0]?.imageUrl ?? null,
                    brandName: product.brand?.name ?? null,
                    categoryName: product.category?.name ?? null,
                    department,
                },
            },
        });
        setIsSendingToAdmin(false);
    };

    if (productQuery.isLoading) {
        return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Đang tải chi tiết sản phẩm...</div>;
    }

    if (productQuery.isError || !product) {
        return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Không thể tải thông tin sản phẩm.</div>;
    }
    return (
        <div className="space-y-8">
            <div>
                <Link to={`/${department}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ChevronLeft className="size-4" />
                    Quay lại danh sách
                </Link>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
                <section className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        {allImages[selectedImage] ? (
                            <img src={allImages[selectedImage]} alt={product.name} className="h-[320px] w-full object-cover sm:h-[440px] lg:h-[560px]" />
                        ) : (
                            <div className="flex h-[320px] w-full items-center justify-center text-slate-500 sm:h-[440px] lg:h-[560px]">Không có ảnh</div>
                        )}
                    </div>

                    {allImages.length > 1 ? (
                        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                            {allImages.map((image, index) => (
                                <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => setSelectedImage(index)}
                                    className={`overflow-hidden rounded-lg border ${index === selectedImage ? "border-primary" : "border-slate-200"}`}
                                >
                                    <img src={image} alt={`${product.name}-${index + 1}`} className="h-20 w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </section>

                <section className="space-y-5  ">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <div className="inline-flex items-center gap-1 text-amber-500">
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className={`size-4 ${index < roundedAverageRating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                                    />
                                ))}
                            </div>
                            <span>{averageRating.toFixed(1)}</span>
                            <span>({reviewCount} đánh giá)</span>
                        </div>
                    </div>

                    <div className="rounded-lg bg-sky-50 p-4">
                        <p className="text-sm text-slate-600">Giá</p>
                        <p className="text-3xl font-black text-primary">{formatCurrency(product.price)}</p>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600">
                        <div>Thương hiệu: <span className="font-semibold text-slate-900">{product.brand?.name ?? "Đang cập nhật"}</span></div>
                        <div>Danh mục: <span className="font-semibold text-slate-900">{product.category?.name ?? "Đang cập nhật"}</span></div>
                        <div>
                            Còn lại: <span className="font-semibold text-slate-900">{displayedStockQuantity}</span>
                        </div>
                        <div>
                            Đã bán: <span className="font-semibold text-slate-900">{displayedSoldQuantity}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Màu sắc</p>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((colorOption) => (
                                <button
                                    key={colorOption.id}
                                    type="button"
                                    onClick={() => setSelectedColorId((current) => (current === colorOption.id ? null : colorOption.id))}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${selectedColorId === colorOption.id ? "border-primary  bg-primary/5 text-primary font-medium" : "border-slate-200 hover:border-primary/50"}`}
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

                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Kích cỡ</p>
                        <div className="flex flex-wrap gap-2">
                            {sizeOptions.map((sizeOption) => (
                                <button
                                    key={sizeOption.id}
                                    type="button"
                                    onClick={() => setSelectedSizeId((current) => (current === sizeOption.id ? null : sizeOption.id))}
                                    className={`rounded-lg border px-3 py-1.5 text-sm ${selectedSizeId === sizeOption.id ? "border-primary  bg-primary/5 text-primary font-medium" : "border-slate-200 hover:border-primary/50"}`}
                                >
                                    {sizeOption.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <QuantityStepper value={quantity} onChange={setQuantity} className="w-full sm:w-auto" />

                        <Button
                            className="h-10 w-full flex-1 gap-2 sm:w-auto"
                            disabled={!canAddToCart || !selectedCartVariant || !hasStock || isAddingToCart}
                            onClick={handleAddToCart}
                        >
                            <ShoppingCart className="size-4" />
                            {isAddingToCart
                                ? "Đang thêm..."
                                : !hasStock && canAddToCart
                                    ? "Hết hàng"
                                    : canAddToCart
                                        ? "Thêm vào giỏ"
                                        : "Chọn màu và kích cỡ"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            disabled={isTogglingWishlist}
                            onClick={handleToggleWishlist}
                            aria-label={isInWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                        >
                            <Heart className={`size-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        disabled={isSendingToAdmin}
                        onClick={() => void handleSendProductToAdmin()}
                    >
                        {isSendingToAdmin ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
                        {isSendingToAdmin ? "Đang gửi cho admin..." : "Gửi sản phẩm này cho admin"}
                    </Button>
                </section>
            </div>

            <section className="border-slate-200 bg-white">
                <div className="border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
                        <button
                            type="button"
                            onClick={() => setActiveTab("description")}
                            className={`relative pb-3 transition-colors ${activeTab === "description" ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Mô tả
                            {activeTab === "description" ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" /> : null}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("reviews")}
                            className={`relative pb-3 transition-colors ${activeTab === "reviews" ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Đánh giá ({reviewCount})
                            {activeTab === "reviews" ? <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" /> : null}
                        </button>
                    </div>
                </div>

                {activeTab === "description" ? (
                    <p className="mt-5 text-sm leading-6 text-slate-600">
                        {product.description?.trim() || "Sản phẩm hiện chưa có mô tả chi tiết. Vui lòng quay lại sau."}
                    </p>
                ) : (
                    <div className="mt-5 space-y-4">
                        {reviewsQuery.isLoading || reviewSummaryQuery.isLoading ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                                <Loader2 className="mb-2 size-4 animate-spin" />
                                Đang tải đánh giá...
                            </div>
                        ) : reviewsQuery.isError || reviewSummaryQuery.isError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                Không thể tải đánh giá sản phẩm.
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-sm text-slate-500">
                                Chưa có đánh giá nào cho sản phẩm này.
                            </div>
                        ) : (
                            reviews.map((review) => {
                                const ratingValue = Math.max(0, Math.min(5, Number(review.rating) || 0));
                                const roundedRating = Math.round(ratingValue);
                                const author = review.user?.name || "Khách hàng";

                                return (
                                    <article key={review.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                                                    {toAlias(author)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{author}</p>
                                                    <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-1 text-amber-500">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <Star
                                                        key={index}
                                                        className={`size-4 ${index < roundedRating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                                                    />
                                                ))}
                                                <span className="ml-1 text-xs text-slate-500">{ratingValue.toFixed(1)}</span>
                                            </div>
                                        </div>

                                        {review.comment ? (
                                            <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p>
                                        ) : null}

                                        {review.images.length > 0 ? (
                                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                {review.images.map((imageUrl, index) => (
                                                    <a
                                                        key={`${review.id}-image-${index}`}
                                                        href={imageUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block overflow-hidden rounded-lg border border-slate-200 bg-white"
                                                    >
                                                        <img
                                                            src={imageUrl}
                                                            alt={`review-${review.id}-${index + 1}`}
                                                            className="h-24 w-full object-cover"
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

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Sản phẩm liên quan</h2>
                {isRelatedLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="h-72 animate-pulse rounded-xl bg-slate-200" />
                        ))}
                    </div>
                ) : relatedProducts.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Không có sản phẩm liên quan.</div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {relatedProducts.map((relatedProduct) => {
                            return (
                                <ProductCard
                                    department={department}
                                    key={relatedProduct.id}
                                    product={relatedProduct}
                                />
                            );
                        })}
                    </div>
                )}
            </section>


        </div>
    );
};

export default ProductDetailPage;
