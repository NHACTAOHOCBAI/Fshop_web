import axiosInstance from "@/lib/axios";
import type { Address, UpsertAddressPayload } from "@/types/address";
import type { ApiResponse } from "@/types/response";

export const getMyAddresses = async () => {
    const { data } = await axiosInstance.get<ApiResponse<Address[]>>("/addresses");
    return data;
};

export const createAddress = async (payload: UpsertAddressPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<Address>>("/addresses", payload);
    return data;
};

export const updateAddress = async ({ id, payload }: { id: number; payload: UpsertAddressPayload }) => {
    const { data } = await axiosInstance.patch<ApiResponse<Address>>(`/addresses/${id}`, payload);
    return data;
};

export const setDefaultAddress = async (id: number) => {
    const { data } = await axiosInstance.patch<ApiResponse<Address>>(`/addresses/default/${id}`);
    return data;
};

export const deleteAddress = async (id: number) => {
    const { data } = await axiosInstance.delete<ApiResponse<null>>(`/addresses/${id}`);
    return data;
};