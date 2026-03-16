import axiosInstance from "@/lib/axios";
import type { CreateOrderPayload, GetMyOrdersParams, Order } from "@/types/order";
import type { ApiResponse } from "@/types/response";

export const createOrder = async (payload: CreateOrderPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<Order>>("/orders", payload);
    return data;
};

export const getMyOrders = async (params?: GetMyOrdersParams) => {
    const { data } = await axiosInstance.get<ApiResponse<Order[]>>("/orders/me", {
        params,
    });
    return data;
};

export const cancelOrder = async ({ id, reason }: { id: number; reason?: string }) => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(`/orders/${id}/cancel`, {
        reason,
    });
    return data;
};

export const confirmDelivery = async (orderId: number) => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(`/orders/${orderId}/confirm-delivery`);
    return data;
};
