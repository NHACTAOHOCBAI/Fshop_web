import axiosInstance from "@/lib/axios";
import type { Address } from "@/types/address";
import type { ApiResponse } from "@/types/response";

export const getMyAddresses = async () => {
    const { data } = await axiosInstance.get<ApiResponse<Address[]>>("/addresses");
    return data;
};