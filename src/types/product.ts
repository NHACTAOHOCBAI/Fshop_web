import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";

export type ProductImage = {
    id: number;
    imageUrl?: string;
    publicId?: string;
    productId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ProductVariant = {
    id: number;
    imageUrl?: string;
    publicId?: string;
    sku?: string;
    price: number;
    productId: number;
    colorId: number;
    sizeId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    product: Product;
};

export type Product = {
    id: number;
    name: string;
    description?: string;
    brandId: number;
    categoryId: number;
    price: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    brand?: Brand;
    category?: Category;
    images?: ProductImage[];
    variants?: ProductVariant[];
};

export type CreateProductVariantPayload = {
    sku?: string;
    colorId: number;
    sizeId: number;
    price: number;
    image: File;
};

export type CreateProductPayload = {
    name: string;
    description?: string;
    brandId: number;
    categoryId: number;
    productImages: File[];
    variants: CreateProductVariantPayload[];
};
