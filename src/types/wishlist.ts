import type { Product } from "@/types/product";

export type WishlistItem = {
    id: number;
    product: Product;
    createdAt: string;
};

export type ToggleWishlistPayload = {
    productId: number;
};

export type ToggleWishlistResult = {
    message: string;
    action: "added" | "removed";
    productId: number;
};
