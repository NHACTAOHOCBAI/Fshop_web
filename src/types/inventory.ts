import type { ProductVariant } from "@/types/product";

export type InventoryType = "IMPORT" | "EXPORT" | "RETURN" | "ADJUSTMENT";

export type Inventory = {
    id: number;
    variantId: number;
    quantity: number;
    createdAt: string;
    updatedAt: string;
    variant?: ProductVariant;
};

export type InventoryTransaction = {
    id: number;
    variantId: number;
    userId: number;
    type: InventoryType;
    quantity: number;
    note?: string;
    createdAt: string;
};
