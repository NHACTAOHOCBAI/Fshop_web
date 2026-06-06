import axiosInstance from "@/lib/axios";
import type { Cart } from "@/types/cart";
import type { ApiResponse } from "@/types/response";
import type { CreateOutfitPayload, Outfit, UpdateOutfitPayload } from "@/types/outfit";

export const getMyOutfits = async () => {
    const { data } = await axiosInstance.get<ApiResponse<Outfit[]>>("/outfits/me");
    return data;
};

export const getOutfitById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Outfit>>(`/outfits/${id}`);
    return data;
};

export const createOutfit = async (payload: CreateOutfitPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<Outfit>>("/outfits", payload);
    return data;
};

export const updateOutfit = async ({ id, payload }: { id: number; payload: UpdateOutfitPayload }) => {
    const { data } = await axiosInstance.patch<ApiResponse<Outfit>>(`/outfits/${id}`, payload);
    return data;
};

export const deleteOutfit = async (id: number) => {
    const { data } = await axiosInstance.delete<ApiResponse<{ deleted: boolean; id: number }>>(`/outfits/${id}`);
    return data;
};

export type AddOutfitToCartResponse = {
    cart: Cart;
    addedItems: Array<{
        productId: number;
        productName: string;
        variantId: number;
        sku?: string;
        quantity: number;
    }>;
    skippedItems: Array<{
        productId: number;
        productName: string;
        variantId: number;
        sku?: string;
    }>;
};

export const addOutfitToCart = async (id: number) => {
    const { data } = await axiosInstance.post<ApiResponse<AddOutfitToCartResponse>>(`/outfits/${id}/add-to-cart`);
    return data;
};
