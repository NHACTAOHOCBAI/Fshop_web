import axiosInstance from "@/lib/axios";
import type { Product } from "@/types/product";
import type { PaginatedApiResponse } from "@/types/response";

export const getFrequentlyBoughtTogether = async (productId: number, limit: number = 4) => {
    const response = await axiosInstance.get<PaginatedApiResponse<Product>>(`/recommendations/frequently-bought-together/${productId}`, {
        params: { limit },
    });
    return response.data;
};

export const getPersonalizedRecommendations = async (limit: number = 10) => {
    const response = await axiosInstance.get<PaginatedApiResponse<Product>>('/recommendations/personalize', {
        params: { limit },
    });
    return response.data;
};

