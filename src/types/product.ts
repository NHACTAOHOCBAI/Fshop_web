import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { Color, Size } from "@/types/attribute";

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
    stockQuantity?: number;
    soldQuantity?: number;
    productId: number;
    colorId: number;
    sizeId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    product: Product;
    color?: Color;
    size?: Size;
};

export type Product = {
    id: number;
    name: string;
    description?: string;
    brandId: number;
    categoryId: number;
    price: number;
    averageRating?: number | string;
    reviewCount?: number;
    soldQuantity?: number;
    maxCouponDiscount?: number | string;
    bestCouponCode?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    brand?: Brand;
    category?: Category;
    images?: ProductImage[];
    variants?: ProductVariant[];
};

export type ProductTryonAssetType = "glasses" | "hat" | "accessory";

export type ProductTryonAsset = {
    id: number;
    productId: number;
    variantId?: number | null;
    assetType: ProductTryonAssetType;
    displayName: string;
    deeparEffectUrl: string;
    thumbnailUrl?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    variant?: ProductVariant | null;
};

export type CreateProductTryonAssetPayload = {
    productId: number;
    variantId?: number | null;
    assetType: ProductTryonAssetType;
    displayName: string;
    deeparEffectUrl: string;
    thumbnailUrl?: string | null;
    isActive?: boolean;
};

export type UpdateProductTryonAssetPayload = {
    productId: number;
    assetId: number;
    variantId?: number | null;
    assetType?: ProductTryonAssetType;
    displayName?: string;
    deeparEffectUrl?: string;
    thumbnailUrl?: string | null;
    isActive?: boolean;
};

export type CreateProductVariantPayload = {
    sku?: string;
    colorId: number;
    sizeId: number;
    image: File;
};

export type CreateProductPayload = {
    name: string;
    description?: string;
    brandId: number;
    categoryId: number;
    price: number;
    productImages: File[];
    variants: CreateProductVariantPayload[];
};

export type UpdateProductPayload = {
    name?: string;
    description?: string;
    brandId?: number;
    categoryId?: number;
    price?: number;
    isActive?: boolean;
};

export type UpsertProductVariantPayload = {
    id?: number;
    sku?: string;
    colorId: number;
    sizeId: number;
    imageFileIndex?: number;
    removeImage?: boolean;
};

export type UpdateProductFullPayload = {
    id: number;
    payload: UpdateProductPayload & {
        keepImageIds?: number[];
        removeVariantIds?: number[];
        variants?: UpsertProductVariantPayload[];
    };
    productImages?: File[];
    variantImages?: File[];
};

export type ImageSearchResult = {
    product_id: number;
    score: number;
    image_url?: string;
};

export type VoiceSearchResponse = {
    transcribed_text: string;
    products: ImageSearchResult[];
    normalized_query?: string;
    rewritten_query?: string;
    intent?: string;
    filters?: Record<string, unknown>;
    asr_confidence?: number;
    asr?: {
        language?: string;
        language_probability?: number;
        avg_logprob?: number;
        no_speech_probability?: number;
        confidence?: number;
        model?: string;
        device?: string;
        compute_type?: string;
    };
    latency_ms?: number;
    search_debug?: Record<string, unknown> | null;
};

export type VoiceTranscriptionResponse = Omit<VoiceSearchResponse, "products">;
