import axiosInstance from "@/lib/axios";
import type {
    CreateOrderPayload,
    GetAllOrdersParams,
    GetMyOrdersParams,
    Order,
    OrderStatusUpdateResponse,
    UpdateOrderStatusPayload,
} from "@/types/order";
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

export const getMyOrderById = async (orderId: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Order>>(`/orders/me/${orderId}`);
    return data;
};

export const getOrderById = async (orderId: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return data;
};

export const getAllOrders = async (params?: GetAllOrdersParams) => {
    const { data } = await axiosInstance.get<ApiResponse<Order[]>>("/orders/all", {
        params,
    });
    return data;
};

export const updateOrderStatus = async ({
    id,
    payload,
}: {
    id: number;
    payload: UpdateOrderStatusPayload;
}) => {
    const { data } = await axiosInstance.patch<ApiResponse<OrderStatusUpdateResponse>>(`/orders/${id}/status`, payload);
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
