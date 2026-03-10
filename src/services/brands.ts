import axiosInstance from "@/lib/axios";
import type { Brand } from "@/types/brand";
import type { QueryParams } from "@/types/query";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

export const getBrands = async ({ limit, page, search, sortOrder, sortBy }: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Brand>>("/brands", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const getBrandById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Brand>>(`/brands/${id}`);
    return data;
};

export const getBrandBySlug = async (slug: string) => {
    const { data } = await axiosInstance.get<ApiResponse<Brand>>(`/brands/slug/${slug}`);
    return data;
};

export const deleteBrand = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/brands/${id}`);
};
