import axiosInstance from "@/lib/axios";
import type { CreateOrderPayload, Order } from "@/types/order";
import type { ApiResponse } from "@/types/response";

export const createOrder = async (payload: CreateOrderPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<Order>>("/orders", payload);
    return data;
};
