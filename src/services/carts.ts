import axiosInstance from "@/lib/axios";
import type { Cart } from "@/types/cart";

export const getMyCart = async () => {
    const { data } = await axiosInstance.get<Cart>("/carts/me");
    return data;
};

export const addToCart = async (payload: { variantId: number; quantity: number }) => {
    const { data } = await axiosInstance.post<Cart>("/carts/add", payload);
    return data;
};

export const removeFromCart = async (payload: { variantId: number; quantity: number }) => {
    const { data } = await axiosInstance.post<Cart>("/carts/remove", payload);
    return data;
};
