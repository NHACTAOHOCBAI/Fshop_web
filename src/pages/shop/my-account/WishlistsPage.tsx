import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useToggleWishlist, useWishlists } from "@/hooks/useWishlists";
import { useAddToCart } from "@/hooks/useCart";
import { extractApiErrorMessage } from "@/lib/api-error";
import type { DepartmentType } from "@/types/category";
import ProductCard from "@/pages/shop/products/components/ProductCard";

const resolveDepartment = (department?: string): DepartmentType => {
    const normalized = department?.toLowerCase();

    if (normalized === "women" || normalized === "kids") {
        return normalized;
    }

    return "men";
};

const WishlistsPage = () => {
    const { data, isLoading } = useWishlists();
    const { mutate: toggleWishlist, isPending: isTogglingWishlist } = useToggleWishlist();
    const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
    const wishlistItems = data?.data ?? [];
    const isMutating = isTogglingWishlist || isAddingToCart;

    const handleRemoveWishlist = (productId: number) => {
        toggleWishlist(
            { productId },
            {
                onSuccess: () => {
                    toast.success("Đã xóa khỏi danh sách yêu thích");
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Không thể xóa khỏi yêu thích"));
                },
            }
        );
    };

    const handleAddToCart = (productId: number, variantId?: number) => {
        if (!variantId) {
            toast.error("Sản phẩm hiện chưa có biến thể để thêm vào giỏ");
            return;
        }

        addToCart(
            { variantId, quantity: 1 },
            {
                onSuccess: () => {
                    toast.success("Đã thêm vào giỏ hàng");
                    toggleWishlist({ productId });
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Không thể thêm vào giỏ hàng"));
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Danh sách yêu thích</h1>
                <p className="mt-1 text-sm text-slate-500">{wishlistItems.length} sản phẩm đã lưu</p>
            </div>

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="h-84 animate-pulse rounded-2xl bg-slate-200" />
                    ))}
                </div>
            ) : wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
                    <Heart className="size-10 text-slate-300" />
                    <p className="text-sm text-slate-500">Chưa có sản phẩm yêu thích nào</p>
                    <Button asChild variant="outline" size="sm">
                        <Link to="/men">Khám phá sản phẩm</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {wishlistItems.map((item) => {
                        const product = item.product;
                        const firstVariant = product.variants?.find((variant) => variant.isActive) ?? product.variants?.[0];
                        const canAddToCart = Boolean(firstVariant);

                        return (
                            <ProductCard
                                key={item.id}
                                product={product}
                                department={resolveDepartment(product.category?.department)}
                                actionSlot={(
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            disabled={isMutating || !canAddToCart}
                                            variant={canAddToCart ? "default" : "outline"}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                handleAddToCart(product.id, firstVariant?.id);
                                            }}
                                        >
                                            <ShoppingCart className="mr-1.5 size-3.5" />
                                            {canAddToCart ? "Thêm vào giỏ" : "Hết hàng"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={isMutating}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                handleRemoveWishlist(product.id);
                                            }}
                                            aria-label="Xóa khỏi danh sách"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                )}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WishlistsPage;
