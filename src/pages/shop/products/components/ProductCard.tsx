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

const isCreatedWithinOneDay = (createdAt?: string | null) => {
    if (!createdAt) {
        return false;
    }

    const createdAtDate = new Date(createdAt);
    if (Number.isNaN(createdAtDate.getTime())) {
        return false;
    }

    const diffInMilliseconds = Date.now() - createdAtDate.getTime();
    return diffInMilliseconds >= 0 && diffInMilliseconds < 24 * 60 * 60 * 1000;
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
    const showNewBadge = isCreatedWithinOneDay(product.createdAt);

    const cardContent = (
        <div className="flex h-full flex-col">
            <div className="relative h-56 w-full shrink-0 overflow-hidden bg-slate-100">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5IiAvPjwvc3ZnPg=='; // fallback
                        }}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs text-slate-500">
                        Không có ảnh
                    </div>
                )}

                {showNewBadge ? (
                    <span className="absolute right-2 top-2 rounded-md bg-app-secondary px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                        Mới
                    </span>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col p-3.5 space-y-2">
                <p className="truncate text-xs font-medium text-slate-400" title={brandName ?? product.brand?.name ?? "FShop"}>
                    {brandName ?? product.brand?.name ?? '\u00A0'}
                </p>
                <p className="line-clamp-2 min-h-[40px] text-sm font-semibold text-slate-800" title={product.name}>
                    {product.name}
                </p>
                <div className="flex flex-wrap items-baseline gap-1.5">
                    {hasCouponDiscount ? (
                        <>
                            <span className="text-base font-bold text-primary">
                                {formatCurrency(discountedPrice)}
                            </span>
                            <span className="truncate text-xs text-slate-400 line-through">
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
                    <div className="truncate rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700" title={`Giảm tối đa ${formatCurrency(maxCouponDiscount)}${bestCouponCode ? ` với mã ${bestCouponCode}` : ''}`}>
                        <span className="font-semibold">Giảm {formatCurrency(maxCouponDiscount)}</span>
                        {bestCouponCode ? <span> mã {bestCouponCode}</span> : null}
                    </div>
                ) : null}
                
                <div className="mt-auto pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <div className="flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-700">{normalizedRating.toFixed(1)}</span>
                    </div>
                    <span className="text-slate-500">({formatCompactNumber(reviewCount)})</span>
                    <span className="truncate text-slate-500">Đã bán {formatCompactNumber(soldQuantity)}</span>
                </div>
                {actionSlot ? <div className="pt-1">{actionSlot}</div> : null}
            </div>
        </div>
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