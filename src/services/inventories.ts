import axiosInstance from "@/lib/axios";
import type { Inventory, InventoryTransaction, InventoryType } from "@/types/inventory";
import type { ApiResponse } from "@/types/response";

type InventoryListPayload = {
    data: Inventory[];
    total: number;
};

type TransactionListPayload = {
    data: InventoryTransaction[];
    total: number;
};

export const getInventories = async ({ page = 1, limit = 10 }: { page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get<ApiResponse<InventoryListPayload>>("/inventories", {
        params: { page, limit },
    });

    return {
        pagination: {
            total: data.data.total,
            page,
            limit,
        },
        data: data.data.data,
    };
};

export const getLowStockInventories = async (threshold: number = 10) => {
    const { data } = await axiosInstance.get<ApiResponse<Inventory[]>>("/inventories/low-stock", {
        params: { threshold },
    });

    return data.data;
};

export const createInventory = async (payload: { variantId: number; quantity?: number }) => {
    return axiosInstance.post("/inventories", payload);
};

export const updateInventory = async ({ id, data }: { id: number; data: { quantity?: number } }) => {
    return axiosInstance.patch(`/inventories/${id}`, data);
};

export const deleteInventory = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/inventories/${id}`);
};

export const createInventoryTransaction = async (payload: {
    variantId: number;
    type: InventoryType;
    quantity: number;
    note?: string;
}) => {
    return axiosInstance.post("/inventories/transactions/create", payload);
};

export const getInventoryTransactionHistory = async ({
    variantId,
    page = 1,
    limit = 10,
}: {
    variantId: number;
    page?: number;
    limit?: number;
}) => {
    const { data } = await axiosInstance.get<ApiResponse<TransactionListPayload>>(
        `/inventories/${variantId}/transactions`,
        {
            params: { page, limit },
        }
    );

    return {
        total: data.data.total,
        data: data.data.data,
    };
};
