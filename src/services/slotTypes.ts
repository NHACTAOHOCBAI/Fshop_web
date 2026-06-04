import axiosInstance from "@/lib/axios";
import type { SlotType } from "@/types/category";
import type { QueryParams } from "@/types/query";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

export const getSlotTypes = async (params?: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<SlotType>>("/slot-types", {
        params,
    });
    return data;
};

export const getSlotTypeById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<SlotType>>(`/slot-types/${id}`);
    return data;
};

export const deleteSlotType = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/slot-types/${id}`);
};

export const createSlotType = async (data: {
    name: string;
    code: string;
    hint?: string;
}) => {
    return axiosInstance.post("/slot-types", data);
};

export const updateSlotType = async ({
    id,
    data,
}: {
    id: number;
    data: {
        name?: string;
        code?: string;
        hint?: string;
    };
}) => {
    return axiosInstance.patch(`/slot-types/${id}`, data);
};
