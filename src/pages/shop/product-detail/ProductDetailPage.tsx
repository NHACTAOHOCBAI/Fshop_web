import { ChevronLeft, Heart, ShoppingCart, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import QuantityStepper from "@/components/ui/quantity-stepper";
import { useColors, useSizes } from "@/hooks/useAttributes";
import { useProductById, useRelatedProducts } from "@/hooks/useProducts";
import type { DepartmentType } from "@/types/category";
import ProductCard from "../products/components/ProductCard";

const departmentList: DepartmentType[] = ["men", "women", "kids"];

type MockReview = {
    id: number;
    author: string;
    rating: number;
    createdAt: string;
    content: string;
    avatarUrl?: string;
};

const mockReviews: MockReview[] = [
    {
        id: 1,
        author: "Nguyen Minh Anh",
        rating: 5,
        createdAt: "2026-03-01",
        content: "Form giày đẹp, dễ đi và nhìn ngoài rất xinh. Màu sắc đúng như hình, đóng gói cẩn thận.",
        avatarUrl: "https://i.pravatar.cc/80?img=32",
    },
    {
        id: 2,
        author: "Tran Bao Chau",
        rating: 4,
        createdAt: "2026-02-24",
        content: "Chất liệu ổn, nhẹ chân. Giao hàng nhanh. Nếu lót đệm dày hơn một chút thì sẽ rất tuyệt.",
        avatarUrl: "https://i.pravatar.cc/80?img=47",
    },
    {
        id: 3,
        author: "Le Quoc Huy",
        rating: 5,
        createdAt: "2026-02-17",
        content: "Đã mua lần thứ hai vì mang rất êm. Size chuẩn, phối đồ dễ, giá hợp lý.",
        avatarUrl: "https://i.pravatar.cc/80?img=15",
    },
];

const formatCurrency = (price: number) => `${new Intl.NumberFormat("vi-VN").format(price)}đ`;
const formatReviewDate = (value: string) => new Intl.DateTimeFormat("vi-VN").format(new Date(value));
const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

const ProductDetailPage = () => {
    const params = useParams<{ department?: string; productId?: string }>();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

    const department = useMemo<DepartmentType>(() => {
        const rawDepartment = params.department?.toLowerCase();
        if (rawDepartment && departmentList.includes(rawDepartment as DepartmentType)) {
            return rawDepartment as DepartmentType;
        }

        return "men";
    }, [params.department]);

    const productId = Number(params.productId);
    const productQuery = useProductById(productId, Number.isFinite(productId));
    const colorsQuery = useColors({ page: 1, limit: 200, sortBy: "name", sortOrder: "ASC" });
    const sizesQuery = useSizes({ page: 1, limit: 200, sortBy: "sortOrder", sortOrder: "ASC" });
    const product = productQuery.data?.data;

    const colorMap = useMemo(() => {
        const colors = colorsQuery.data?.data.data ?? [];
        return new Map(colors.map((color) => [color.id, color]));
    }, [colorsQuery.data?.data.data]);

    const sizeMap = useMemo(() => {
        const sizes = sizesQuery.data?.data.data ?? [];
        return new Map(sizes.map((size) => [size.id, size]));
    }, [sizesQuery.data?.data.data]);

    const allImages = useMemo(() => {
        if (!product) {
            return [];
        }

        const productImages = (product.images ?? []).map((image) => image.imageUrl).filter(Boolean) as string[];
        const variantImages = (product.variants ?? []).map((variant) => variant.imageUrl).filter(Boolean) as string[];

        return Array.from(new Set([...productImages, ...variantImages]));
    }, [product]);

    const selectedVariant = useMemo(() => {
        if (!product?.variants || product.variants.length === 0) {
            return undefined;
        }

        return product.variants.find((variant) => {
            if (selectedColorId && variant.colorId !== selectedColorId) {
                return false;
            }

            if (selectedSizeId && variant.sizeId !== selectedSizeId) {
                return false;
            }

            return true;
        }) ?? product.variants[0];
    }, [product?.variants, selectedColorId, selectedSizeId]);

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

    const minPrice = useMemo(() => {
        if (!product?.variants || product.variants.length === 0) {
            return null;
        }

        return Math.min(...product.variants.map((variant) => variant.price));
    }, [product?.variants]);

    const displayPrice = selectedVariant?.price ?? minPrice;
    const canAddToCart = selectedColorId !== null && selectedSizeId !== null;
    const averageRating = useMemo(() => {
        if (mockReviews.length === 0) {
            return 0;
        }

        const total = mockReviews.reduce((sum, review) => sum + review.rating, 0);
        return total / mockReviews.length;
    }, []);
    const roundedAverageRating = Math.round(averageRating);

    const { relatedProducts, isLoading: isRelatedLoading } = useRelatedProducts(product?.categoryId, product?.id);

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
                            <img src={allImages[selectedImage]} alt={product.name} className="h-120 w-full object-cover" />
                        ) : (
                            <div className="flex h-120 w-full items-center justify-center text-slate-500">Không có ảnh</div>
                        )}
                    </div>

                    {allImages.length > 1 ? (
                        <div className="grid grid-cols-5 gap-2">
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
                            <span>({mockReviews.length} đánh giá)</span>
                        </div>
                    </div>

                    <div className="rounded-lg bg-sky-50 p-4">
                        <p className="text-sm text-slate-600">Giá</p>
                        <p className="text-3xl font-black text-primary">{displayPrice ? formatCurrency(displayPrice) : "Liên hệ"}</p>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600">
                        <div>Thương hiệu: <span className="font-semibold text-slate-900">{product.brand?.name ?? "Đang cập nhật"}</span></div>
                        <div>Danh mục: <span className="font-semibold text-slate-900">{product.category?.name ?? "Đang cập nhật"}</span></div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-slate-700">Màu sắc</p>
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map((colorOption) => (
                                <button
                                    key={colorOption.id}
                                    type="button"
                                    onClick={() => setSelectedColorId((current) => (current === colorOption.id ? null : colorOption.id))}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${selectedColorId === colorOption.id ? "border-primary bg-[#F6F7F8] text-primary font-medium" : "border-slate-200 hover:border-primary/50"}`}
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
                                    className={`rounded-lg border px-3 py-1.5 text-sm ${selectedSizeId === sizeOption.id ? "border-primary bg-[#F6F7F8] text-primary font-medium" : "border-slate-200 hover:border-primary/50"}`}
                                >
                                    {sizeOption.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <QuantityStepper value={quantity} onChange={setQuantity} />

                        <Button className="h-10 flex-1 gap-2" disabled={!canAddToCart}>
                            <ShoppingCart className="size-4" />
                            {canAddToCart ? "Thêm vào giỏ" : "Chọn màu và kích cỡ"}
                        </Button>
                        <Button type="button" variant="outline" size="icon">
                            <Heart className="size-4" />
                        </Button>
                    </div>
                </section>
            </div>

            <section className="  border-slate-200 bg-white ">
                <div className="border-b border-slate-200">
                    <div className="flex items-center gap-6 text-sm font-medium">
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
                            Đánh giá ({mockReviews.length})
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
                        {mockReviews.map((review) => (
                            <article key={review.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        {review.avatarUrl ? (
                                            <img
                                                src={review.avatarUrl}
                                                alt={review.author}
                                                className="size-10 rounded-full border border-slate-200 object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                                                {getInitials(review.author)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{review.author}</p>
                                            <p className="text-xs text-slate-500">{formatReviewDate(review.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="inline-flex items-center gap-1 text-amber-500">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Star
                                                key={index}
                                                className={`size-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{review.content}</p>
                            </article>
                        ))}
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
