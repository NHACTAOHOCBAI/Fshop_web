import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createInventory,
    createInventoryTransaction,
    deleteInventory,
    getInventories,
    getInventoryTransactionHistory,
    getLowStockInventories,
    updateInventory,
} from "@/services/inventories";
import type { QueryParams } from "@/types/query";

export const useInventories = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["inventories", params],
        queryFn: () => getInventories({ page: params?.page, limit: params?.limit }),
    });
};

export const useLowStockInventories = (threshold: number = 10) => {
    return useQuery({
        queryKey: ["inventories", "low-stock", threshold],
        queryFn: () => getLowStockInventories(threshold),
    });
};

export const useCreateInventory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createInventory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventories"] });
        },
    });
};

export const useUpdateInventory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateInventory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventories"] });
        },
    });
};

export const useDeleteInventory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteInventory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventories"] });
        },
    });
};

export const useCreateInventoryTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createInventoryTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventories"] });
        },
    });
};

export const useInventoryTransactionHistory = (variantId?: number, page: number = 1, limit: number = 20) => {
    return useQuery({
        queryKey: ["inventory-transactions", variantId, page, limit],
        queryFn: () => getInventoryTransactionHistory({ variantId: variantId as number, page, limit }),
        enabled: Boolean(variantId),
    });
};
