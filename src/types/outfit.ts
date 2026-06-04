import type { Product, ProductVariant } from "@/types/product";

export type OutfitSlot = string;

export type OutfitItemLayout = {
    x?: number;
    y?: number;
    scale?: number;
    zIndex?: number;
};

export type OutfitItem = {
    id: number;
    slot: OutfitSlot;
    quantity: number;
    layout?: OutfitItemLayout | null;
    product: Product;
    variant: ProductVariant;
};

export type Outfit = {
    id: number;
    name: string;
    items: OutfitItem[];
    createdAt: string;
    updatedAt: string;
};

export type OutfitItemPayload = {
    slot: OutfitSlot;
    productId: number;
    variantId: number;
    quantity?: number;
    layout?: OutfitItemLayout;
};

export type CreateOutfitPayload = {
    name: string;
    items: OutfitItemPayload[];
};

export type UpdateOutfitPayload = Partial<CreateOutfitPayload>;
