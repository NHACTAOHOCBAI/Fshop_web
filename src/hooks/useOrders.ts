import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import { cancelOrder, confirmDelivery, createOrder, getMyOrders } from "@/services/orders";
import type { GetMyOrdersParams } from "@/types/order";

export const MY_ORDERS_QUERY_KEY = ["orders", "me"] as const;

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

export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ORDERS_QUERY_KEY });
        },
    });
};

export const useConfirmDelivery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: confirmDelivery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ORDERS_QUERY_KEY });
        },
    });
};
