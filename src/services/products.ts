import axiosInstance from "@/lib/axios";
import type {
    CreateProductPayload,
    CreateProductTryonAssetPayload,
    ImageSearchResult,
    Product,
    ProductTryonAsset,
    UpdateProductFullPayload,
    UpdateProductPayload,
    UpdateProductTryonAssetPayload,
    VoiceSearchResponse,
} from "@/types/product";
import type { QueryParams } from "@/types/query";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

export const getProducts = async ({ limit, page, search, sortOrder, sortBy }: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Product>>("/products", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const getProductById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Product>>(`/products/${id}`);
    return data;
};

export const getProductTryonAssets = async (productId: number) => {
    const { data } = await axiosInstance.get<ApiResponse<ProductTryonAsset[]>>(`/products/${productId}/tryon-assets`);
    return data;
};

export const createProductTryonAsset = async ({ productId, ...payload }: CreateProductTryonAssetPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<ProductTryonAsset>>(`/products/${productId}/tryon-assets`, payload);
    return data;
};

export const updateProductTryonAsset = async ({ productId, assetId, ...payload }: UpdateProductTryonAssetPayload) => {
    const { data } = await axiosInstance.patch<ApiResponse<ProductTryonAsset>>(`/products/${productId}/tryon-assets/${assetId}`, payload);
    return data;
};

export const deleteProductTryonAsset = async ({ productId, assetId }: { productId: number; assetId: number }) => {
    const { data } = await axiosInstance.delete<ApiResponse<ProductTryonAsset>>(`/products/${productId}/tryon-assets/${assetId}`);
    return data;
};

export const deleteProduct = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/products/${id}`);
};

export const createProduct = async (payload: CreateProductPayload) => {
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.description) {
        formData.append("description", payload.description);
    }
    formData.append("brandId", String(payload.brandId));
    formData.append("categoryId", String(payload.categoryId));
    formData.append("price", String(payload.price));

    payload.productImages.forEach((file) => {
        formData.append("productImages", file);
    });

    const variants = payload.variants.map((variant) => ({
        sku: variant.sku,
        colorId: variant.colorId,
        sizeId: variant.sizeId,
    }));

    formData.append("variants", JSON.stringify(variants));

    payload.variants.forEach((variant) => {
        formData.append("variantImages", variant.image);
    });

    return axiosInstance.post("/products", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const updateProduct = async ({ id, payload }: { id: number; payload: UpdateProductPayload }) => {
    const { data } = await axiosInstance.patch<ApiResponse<Product>>(`/products/${id}`, payload);
    return data;
};

export const updateProductFull = async ({ id, payload, productImages = [], variantImages = [] }: UpdateProductFullPayload) => {
    const formData = new FormData();

    if (payload.name !== undefined) {
        formData.append("name", payload.name);
    }
    if (payload.description !== undefined) {
        formData.append("description", payload.description);
    }
    if (payload.brandId !== undefined) {
        formData.append("brandId", String(payload.brandId));
    }
    if (payload.categoryId !== undefined) {
        formData.append("categoryId", String(payload.categoryId));
    }
    if (payload.price !== undefined) {
        formData.append("price", String(payload.price));
    }
    if (payload.isActive !== undefined) {
        formData.append("isActive", String(payload.isActive));
    }

    if (payload.keepImageIds) {
        formData.append("keepImageIds", JSON.stringify(payload.keepImageIds));
    }
    if (payload.removeVariantIds) {
        formData.append("removeVariantIds", JSON.stringify(payload.removeVariantIds));
    }
    if (payload.variants) {
        formData.append("variants", JSON.stringify(payload.variants));
    }

    productImages.forEach((file) => {
        formData.append("productImages", file);
    });

    variantImages.forEach((file) => {
        formData.append("variantImages", file);
    });

    const { data } = await axiosInstance.patch<ApiResponse<Product>>(`/products/${id}/full`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};

export const searchByImage = async (file: File, topK: number = 12) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("topK", String(topK));

    const { data } = await axiosInstance.post<ImageSearchResult[]>("/products/search/image", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};

export const searchByVoice = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axiosInstance.post<VoiceSearchResponse>("/products/search/voice", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};
