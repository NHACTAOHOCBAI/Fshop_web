import type { Product } from "@/types/product";

export type CartVariant = {
    id: number;
    imageUrl?: string;
    sku?: string;
    price: number;
    productId: number;
    colorId: number;
    sizeId: number;
    isActive: boolean;
    product: Product;
};

export type CartItem = {
    id: number;
    quantity: number;
    variant: CartVariant;
};

export type Cart = {
    id: number;
    userId: number;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
};
