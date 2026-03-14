import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/response";
import type { ToggleWishlistPayload, ToggleWishlistResult, WishlistItem } from "@/types/wishlist";

export const getMyWishlists = async () => {
    const { data } = await axiosInstance.get<ApiResponse<WishlistItem[]>>("/wishlists");
    return data;
};

export const toggleWishlist = async (payload: ToggleWishlistPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<ToggleWishlistResult>>("/wishlists/toggle", payload);
    return data;
};

export const clearWishlists = async () => {
    const { data } = await axiosInstance.delete<ApiResponse<null>>("/wishlists");
    return data;
};
