import axiosInstance from "@/lib/axios";
import type { CreateProductPayload, Product, ImageSearchResult, VoiceSearchResponse } from "@/types/product";
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

    payload.productImages.forEach((file) => {
        formData.append("productImages", file);
    });

    const variants = payload.variants.map((variant) => ({
        sku: variant.sku,
        colorId: variant.colorId,
        sizeId: variant.sizeId,
        price: variant.price,
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
