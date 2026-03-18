import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import {
    cancelOrder,
    confirmDelivery,
    createOrder,
    getAllOrders,
    getOrderById,
    getMyOrderById,
    getMyOrders,
    updateOrderStatus,
} from "@/services/orders";
import type { GetAllOrdersParams, GetMyOrdersParams, Order, OrderStatus } from "@/types/order";
import type { ApiResponse } from "@/types/response";

export const MY_ORDERS_QUERY_KEY = ["orders", "me"] as const;
export const ALL_ORDERS_QUERY_KEY = ["orders", "all"] as const;

export const useMyOrders = (params?: GetMyOrdersParams) => {
    return useQuery({
        queryKey: [...MY_ORDERS_QUERY_KEY, params],
        queryFn: () => getMyOrders(params),
        enabled: Boolean(authStorage.getAccessToken()),
    });
};

export const useCreateOrder = () => {
    return useMutation({
        mutationFn: createOrder,
    });
};

export const useMyOrderById = (orderId: number, enabled = true) => {
    return useQuery({
        queryKey: [...MY_ORDERS_QUERY_KEY, "detail", orderId],
        queryFn: () => getMyOrderById(orderId),
        enabled: enabled && Number.isFinite(orderId) && orderId > 0 && Boolean(authStorage.getAccessToken()),
    });
};

export const useOrderById = (orderId: number, enabled = true) => {
    return useQuery({
        queryKey: ["orders", "detail", orderId],
        queryFn: () => getOrderById(orderId),
        enabled: enabled && Number.isFinite(orderId) && orderId > 0 && Boolean(authStorage.getAccessToken()),
    });
};

export const useAllOrders = (params?: GetAllOrdersParams) => {
    return useQuery({
        queryKey: [...ALL_ORDERS_QUERY_KEY, params],
        queryFn: () => getAllOrders(params),
        enabled: Boolean(authStorage.getAccessToken()),
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ORDERS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ALL_ORDERS_QUERY_KEY });
        },
    });
};

export const useConfirmDelivery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: confirmDelivery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ORDERS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ALL_ORDERS_QUERY_KEY });
        },
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    const patchOrderStatus = <T extends Order | Order[]>(response: ApiResponse<T> | undefined, id: number, status: OrderStatus) => {
        if (!response) return response;

        const data = response.data;
        if (Array.isArray(data)) {
            const nextList = data.map((order) => (order.id === id ? { ...order, status } : order)) as T;
            return { ...response, data: nextList };
        }

        if (data.id === id) {
            return { ...response, data: { ...data, status } as T };
        }

        return response;
    };

    return useMutation({
        mutationFn: updateOrderStatus,
        onMutate: async ({ id, payload }) => {
            const nextStatus = payload.status;

            await queryClient.cancelQueries({ queryKey: ["orders"] });

            const previousAll = queryClient.getQueriesData<ApiResponse<Order[]>>({ queryKey: ALL_ORDERS_QUERY_KEY });
            const previousMy = queryClient.getQueriesData<ApiResponse<Order[]>>({ queryKey: MY_ORDERS_QUERY_KEY });
            const previousDetail = queryClient.getQueriesData<ApiResponse<Order>>({ queryKey: ["orders", "detail"] });
            const previousMyDetail = queryClient.getQueriesData<ApiResponse<Order>>({ queryKey: [...MY_ORDERS_QUERY_KEY, "detail"] });

            queryClient.setQueriesData<ApiResponse<Order[]>>({ queryKey: ALL_ORDERS_QUERY_KEY }, (old) => patchOrderStatus(old, id, nextStatus));
            queryClient.setQueriesData<ApiResponse<Order[]>>({ queryKey: MY_ORDERS_QUERY_KEY }, (old) => patchOrderStatus(old, id, nextStatus));
            queryClient.setQueriesData<ApiResponse<Order>>({ queryKey: ["orders", "detail"] }, (old) => patchOrderStatus(old, id, nextStatus));
            queryClient.setQueriesData<ApiResponse<Order>>({ queryKey: [...MY_ORDERS_QUERY_KEY, "detail"] }, (old) => patchOrderStatus(old, id, nextStatus));

            return {
                previousAll,
                previousMy,
                previousDetail,
                previousMyDetail,
            };
        },
        onError: (_error, _variables, context) => {
            context?.previousAll?.forEach(([key, data]) => queryClient.setQueryData(key, data));
            context?.previousMy?.forEach(([key, data]) => queryClient.setQueryData(key, data));
            context?.previousDetail?.forEach(([key, data]) => queryClient.setQueryData(key, data));
            context?.previousMyDetail?.forEach(([key, data]) => queryClient.setQueryData(key, data));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
};
