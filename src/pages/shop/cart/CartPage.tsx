import { Trash2, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import QuantityStepper from "@/components/ui/quantity-stepper";
import { useAddToCart, useCart, useRemoveFromCart } from "@/hooks/useCart";

import { useColors, useSizes } from "@/hooks/useAttributes";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types/cart";
import { saveCheckoutSession } from "@/lib/checkout";

const SHIPPING_FEE = 20000;

const CartPage = () => {
    const navigate = useNavigate();
    const { data: cart, isLoading, isError } = useCart();
    const { mutate: addToCart, isPending: isAdding } = useAddToCart();
    const { mutate: removeFromCart, isPending: isRemoving } = useRemoveFromCart();
    const colorsQuery = useColors({ page: 1, limit: 200, sortBy: "name", sortOrder: "ASC" });
    const sizesQuery = useSizes({ page: 1, limit: 200, sortBy: "sortOrder", sortOrder: "ASC" });

    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

    const colorMap = useMemo(() => {
        const colors = colorsQuery.data?.data ?? [];
        return new Map(colors.map((c) => [c.id, c]));
    }, [colorsQuery.data?.data]);

    const sizeMap = useMemo(() => {
        const sizes = sizesQuery.data?.data ?? [];
        return new Map(sizes.map((s) => [s.id, s]));
    }, [sizesQuery.data?.data]);

    const items = cart?.items ?? [];
    const toggleCheck = (id: number) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (checkedIds.size === items.length) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(items.map((item) => item.id)));
        }
    };

    const handleIncrease = (item: CartItem) => {
        addToCart({ variantId: item.variant.id, quantity: 1 });
    };

    const handleDecrease = (item: CartItem) => {
        removeFromCart({ variantId: item.variant.id, quantity: 1 });
    };

    const handleRemoveItem = (item: CartItem) => {
        removeFromCart({ variantId: item.variant.id, quantity: item.quantity });
        setCheckedIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
        });
    };

    const handleDeleteChecked = () => {
        const toRemove = items.filter((item) => checkedIds.has(item.id));
        toRemove.forEach((item) => {
            removeFromCart({ variantId: item.variant.id, quantity: item.quantity });
        });
        setCheckedIds(new Set());
    };

    const selectedItems = useMemo(() => {
        return items.filter((item) => checkedIds.has(item.id));
    }, [checkedIds, items]);

    const subtotal = useMemo(() => {
        return selectedItems.reduce((sum, item) => sum + item.variant.product.price * item.quantity, 0);
    }, [selectedItems]);

    const total = subtotal + (selectedItems.length > 0 ? SHIPPING_FEE : 0);

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            return;
        }

        const checkoutItems = selectedItems.map((item) => {
            const product = item.variant.product;
            const imageUrl = item.variant.imageUrl || product?.images?.[0]?.imageUrl;
            const colorName = colorMap.get(item.variant.colorId)?.name;
            const sizeName = sizeMap.get(item.variant.sizeId)?.name;
            const lineTotal = item.variant.price * item.quantity;

            return {
                cartItemId: item.id,
                variantId: item.variant.id,
                productId: item.variant.productId,
                productName: product?.name ?? `Sản phẩm #${item.variant.productId}`,
                imageUrl,
                colorName,
                sizeName,
                unitPrice: item.variant.price,
                quantity: item.quantity,
                lineTotal,
            };
        });

        saveCheckoutSession({
            items: checkoutItems,
            subtotal,
            shippingFee: SHIPPING_FEE,
            total,
            createdAt: new Date().toISOString(),
        });

        navigate("/checkout");
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <ShoppingBag className="size-12 text-slate-300" />
                <p className="text-sm text-slate-500">Vui lòng đăng nhập để xem giỏ hàng.</p>
                <Button asChild>
                    <Link to="/login">Đăng nhập</Link>
                </Button>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <ShoppingBag className="size-12 text-slate-300" />
                <p className="text-base font-medium text-slate-700">Giỏ hàng của bạn đang trống</p>
                <p className="text-sm text-slate-500">Hãy khám phá sản phẩm và thêm vào giỏ hàng nhé!</p>
                <Button asChild variant="default">
                    <Link to="/men">Mua sắm ngay</Link>
                </Button>
            </div>
        );
    }

    const isMutating = isAdding || isRemoving;
    const allChecked = checkedIds.size === items.length && items.length > 0;
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 h-8">
                    <Checkbox
                        id="check-all"
                        checked={allChecked}
                        onCheckedChange={(checked) => {
                            if (checked === "indeterminate") {
                                return;
                            }
                            toggleAll();
                        }}
                        className="cursor-pointer"
                    />
                    <label htmlFor="check-all" className="cursor-pointer text-sm font-medium text-slate-700">
                        {checkedIds.size > 0
                            ? `${checkedIds.size} sản phẩm được chọn`
                            : `${items.length} sản phẩm`}
                    </label>
                </div>

                {checkedIds.size > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteChecked}
                        disabled={isMutating}
                        className="gap-1.5"
                    >
                        <Trash2 className="size-3.5" />
                        Xóa đã chọn
                    </Button>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Item list */}
                <div className="space-y-3">
                    {items.map((item) => {
                        const product = item.variant.product;
                        const imageUrl = item.variant.imageUrl || product?.images?.[0]?.imageUrl;
                        const colorName = colorMap.get(item.variant.colorId)?.name;
                        const sizeName = sizeMap.get(item.variant.sizeId)?.name;
                        const isChecked = checkedIds.has(item.id);
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center gap-4 rounded-2xl border bg-white p-4 transition-colors ${isChecked ? "border-primary/40 bg-primary/2" : "border-slate-200"}`}
                            >
                                <Checkbox
                                    id={`cart-item-${item.id}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                        if (checked === "indeterminate") {
                                            return;
                                        }
                                        toggleCheck(item.id);
                                    }}
                                    className="shrink-0 cursor-pointer"
                                />

                                {/* Image */}
                                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={product?.name ?? "Sản phẩm"}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                            No img
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                                        {product?.name ?? `Sản phẩm #${item.variant.productId}`}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {colorName && (
                                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                {colorName}
                                            </span>
                                        )}
                                        {sizeName && (
                                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                {sizeName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity + price + remove */}
                                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                                    <QuantityStepper
                                        value={item.quantity}
                                        min={1}
                                        onChange={(next) => {
                                            if (next > item.quantity) handleIncrease(item);
                                            else handleDecrease(item);
                                        }}
                                        className="shrink-0"
                                    />
                                    <span className="w-24 text-right text-sm font-bold text-slate-900">
                                        {formatCurrency(item.variant.product.price * item.quantity)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item)}
                                        disabled={isMutating}
                                        className="text-slate-400 transition-colors hover:text-red-500 disabled:opacity-40"
                                        aria-label="Xóa sản phẩm"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Order summary */}
                <div className="h-fit p-5 ">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">Tóm tắt đơn hàng</h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Tạm tính</span>
                            <span className="font-medium text-slate-800">
                                {selectedItems.length > 0 ? formatCurrency(subtotal) : "--"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Phí vận chuyển</span>
                            <span className="font-medium text-slate-800">
                                {selectedItems.length > 0 ? formatCurrency(SHIPPING_FEE) : "--"}
                            </span>
                        </div>
                    </div>

                    <div className="my-4 h-[0.5px] bg-slate-200" />

                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">TỔNG CỘNG</span>
                        <span className="text-xl font-black text-primary">
                            {selectedItems.length > 0 ? formatCurrency(total) : "--"}
                        </span>
                    </div>

                    <Button
                        className="mt-5 h-11 w-full text-sm font-semibold"
                        disabled={selectedItems.length === 0 || isMutating}
                        onClick={handleCheckout}
                    >
                        Thanh toán
                    </Button>

                    <Button asChild variant="ghost" className="mt-2 w-full text-sm text-slate-500">
                        <Link to="/men">Tiếp tục mua sắm</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
