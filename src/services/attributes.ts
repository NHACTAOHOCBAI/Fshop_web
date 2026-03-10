import axiosInstance from "@/lib/axios";
import type { QueryParams } from "@/types/query";
import type { PaginatedApiResponse } from "@/types/response";
import type { Color, Size, SizeType } from "@/types/attribute";

export const getSizeTypes = async ({ limit, page, search, sortOrder, sortBy }: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<SizeType>>("/size-types", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const createSizeType = async (payload: { name: string; description?: string }) => {
    return axiosInstance.post("/size-types", payload);
};

export const updateSizeType = async ({ id, data }: { id: number; data: { name?: string; description?: string } }) => {
    return axiosInstance.patch(`/size-types/${id}`, data);
};

export const deleteSizeType = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/size-types/${id}`);
};

export const getSizes = async ({ limit, page, search, sortOrder, sortBy }: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Size>>("/sizes", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const createSize = async (payload: {
    name: string;
    sizeTypeId: number;
    sortOrder?: number;
}) => {
    return axiosInstance.post("/sizes", payload);
};

export const updateSize = async ({
    id,
    data,
}: {
    id: number;
    data: {
        name?: string;
        sizeTypeId?: number;
        sortOrder?: number;
    };
}) => {
    return axiosInstance.patch(`/sizes/${id}`, data);
};

export const deleteSize = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/sizes/${id}`);
};

export const getColors = async ({ limit, page, search, sortOrder, sortBy }: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Color>>("/colors", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const createColor = async (payload: { name: string; hexCode?: string }) => {
    return axiosInstance.post("/colors", payload);
};

export const updateColor = async ({ id, data }: { id: number; data: { name?: string; hexCode?: string } }) => {
    return axiosInstance.patch(`/colors/${id}`, data);
};

export const deleteColor = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/colors/${id}`);
};
