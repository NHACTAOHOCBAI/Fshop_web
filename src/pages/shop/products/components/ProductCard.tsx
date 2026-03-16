import type { ReactNode } from "react";
import type { ShopCatalogProduct } from "@/hooks/useShopCatalog";
import { formatCurrency } from "@/lib/utils";
import type { DepartmentType } from "@/types/category";
import { Star } from "lucide-react";
import { Link } from "react-router";

type ProductCardProps = {
    product: ShopCatalogProduct;
    department?: DepartmentType;
    actionSlot?: ReactNode;
    brandName?: string;
};

const formatCompactNumber = (value: number) => {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }

    return String(value);
};

const ProductCard = ({ product, department, actionSlot, brandName }: ProductCardProps) => {
    const imageUrl = product.images?.[0]?.imageUrl;
    const basePrice = Number(product.price ?? 0);
    const averageRating = Number(product.averageRating ?? 0);
    const normalizedRating = Number.isFinite(averageRating)
        ? Math.max(0, Math.min(5, averageRating))
        : 0;
    const reviewCount = product.reviewCount ?? 0;
    const soldQuantity = product.soldQuantity ?? 0;
    const maxCouponDiscount = Number(product.maxCouponDiscount ?? 0);
    const hasCouponDiscount = Number.isFinite(maxCouponDiscount) && maxCouponDiscount > 0;
    const discountedPrice = Math.max(0, basePrice - maxCouponDiscount);
    const bestCouponCode = product.bestCouponCode;

    const cardContent = (
        <>
            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500">
                        Không có ảnh
                    </div>
                )}

                <span className="absolute right-2 top-2 rounded-md bg-app-secondary px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                    Mới
                </span>
            </div>
            <div className="p-3.5 space-y-2">
                <p className="text-xs text-slate-400 font-medium">{brandName ?? product.brand?.name}</p>
                <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                    {product.name}
                </p>
                <div className="flex items-baseline gap-2">
                    {hasCouponDiscount ? (
                        <>
                            <span className="text-base font-bold text-primary">
                                {formatCurrency(discountedPrice)}
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                                {formatCurrency(basePrice)}
                            </span>
                        </>
                    ) : (
                        <span className="text-base font-bold text-primary">
                            {formatCurrency(basePrice)}
                        </span>
                    )}
                </div>
                {hasCouponDiscount ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                        <span className="font-semibold">Giảm tối đa {formatCurrency(maxCouponDiscount)}</span>
                        {bestCouponCode ? <span> với mã {bestCouponCode}</span> : null}
                    </div>
                ) : null}
                <div className="mt-2 flex items-center gap-1 text-xs">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-700">{normalizedRating.toFixed(1)}</span>
                    <span className="text-slate-500">({formatCompactNumber(reviewCount)})</span>
                    <span className="text-slate-500">Đã bán {formatCompactNumber(soldQuantity)}</span>
                </div>
                {actionSlot ? <div className="pt-1">{actionSlot}</div> : null}
            </div>
        </>
    );

    if (department) {
        return (
            <Link
                to={`/${department}/products/${product.id}`}
                className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-primary/35"
            >
                {cardContent}
            </Link>
        );
    }

    return (
        <article className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-primary/35">
            {cardContent}
        </article>
    );
};

export default ProductCard;