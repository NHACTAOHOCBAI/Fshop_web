import { Heart, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const mockWishlists = [
    {
        id: 1,
        name: "Áo hoodie unisex form rộng",
        brand: "UrbanWear",
        price: 399000,
        originalPrice: 520000,
        image: null,
        inStock: true,
    },
    {
        id: 2,
        name: "Quần shorts thể thao nam",
        brand: "ActiveFit",
        price: 249000,
        originalPrice: null,
        image: null,
        inStock: true,
    },
    {
        id: 3,
        name: "Đầm wrap midi floral",
        brand: "SoftLook",
        price: 480000,
        originalPrice: 650000,
        image: null,
        inStock: false,
    },
    {
        id: 4,
        name: "Áo sơ mi linen tay dài",
        brand: "CleanLine",
        price: 299000,
        originalPrice: null,
        image: null,
        inStock: true,
    },
    {
        id: 5,
        name: "Giày thể thao chunky sole",
        brand: "StepUp",
        price: 890000,
        originalPrice: 1100000,
        image: null,
        inStock: true,
    },
    {
        id: 6,
        name: "Túi bucket da tổng hợp",
        brand: "CarryOn",
        price: 350000,
        originalPrice: null,
        image: null,
        inStock: false,
    },
];

const WishlistsPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Danh sách yêu thích</h1>
                <p className="mt-1 text-sm text-slate-500">{mockWishlists.length} sản phẩm đã lưu</p>
            </div>

            {mockWishlists.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
                    <Heart className="size-10 text-slate-300" />
                    <p className="text-sm text-slate-500">Chưa có sản phẩm yêu thích nào</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {mockWishlists.map((product) => (
                        <article
                            key={product.id}
                            className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden"
                        >
                            {/* Image */}
                            <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center text-sm text-slate-400">
                                No img
                                {!product.inStock && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white">
                                            Hết hàng
                                        </span>
                                    </div>
                                )}
                                {product.originalPrice && (
                                    <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-slate-400 shadow transition-colors hover:text-red-500"
                                    aria-label="Xóa khỏi danh sách"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="p-3.5 space-y-2">
                                <p className="text-xs text-slate-400 font-medium">{product.brand}</p>
                                <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                                    {product.name}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-base font-bold text-primary">
                                        {formatCurrency(product.price)}
                                    </span>
                                    {product.originalPrice && (
                                        <span className="text-xs text-slate-400 line-through">
                                            {formatCurrency(product.originalPrice)}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={!product.inStock}
                                    variant={product.inStock ? "default" : "outline"}
                                >
                                    <ShoppingCart className="mr-1.5 size-3.5" />
                                    {product.inStock ? "Thêm vào giỏ" : "Hết hàng"}
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistsPage;
