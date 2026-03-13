import type { ShopCatalogProduct } from "@/hooks/useShopCatalog";
import type { DepartmentType } from "@/types/category";
import { Star } from "lucide-react";
import { Link } from "react-router";
const getProductPrice = (product: ShopCatalogProduct) => {
    if (!product.variants || product.variants.length === 0) {
        return "Liên hệ";
    }

    const minPrice = Math.min(...product.variants.map((variant) => variant.price));
    return `${new Intl.NumberFormat("vi-VN").format(minPrice)}đ`;
};

const ProductCard = ({ product, department }: { product: ShopCatalogProduct; department: DepartmentType }) => {
    const imageUrl = product.images?.[0]?.imageUrl;

    return (
        <Link
            to={`/${department}/products/${product.id}`}
            className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-primary/35 
            "
        >
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

            <div className="p-3">
                <p className="mb-1.5 line-clamp-2 text-sm font-medium leading-tight text-slate-800">{product.name}</p>

                <p className="text-lg font-black text-primary">{getProductPrice(product)}</p>

                <p className="mt-1.5 text-xs text-slate-500">{product.category?.name ?? "Khác"}</p>

                <div className="mt-2 flex items-center gap-1 text-xs">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-700">4.8</span>
                    <span className="text-slate-500">Đã bán 1.2k</span>
                </div>
            </div>
        </Link>
    );
};
export default ProductCard;