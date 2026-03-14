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

const ProductCard = ({ product, department, actionSlot, brandName }: ProductCardProps) => {
    const imageUrl = product.images?.[0]?.imageUrl;
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
                    <span className="text-base font-bold text-primary">
                        {formatCurrency(product.price)}
                    </span>
                    {product.price ? (
                        <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(product.price)}
                        </span>
                    ) : null}

                </div>
                <div className="mt-2 flex items-center gap-1 text-xs">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-700">4.8</span>
                    <span className="text-slate-500">Đã bán 1.2k</span>
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