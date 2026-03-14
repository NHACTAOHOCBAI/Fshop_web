import axiosInstance from "@/lib/axios";
import type { Cart } from "@/types/cart";

export const getMyCart = async () => {
    const { data } = await axiosInstance.get("/carts/me");
    return data.data as Cart;
};

export const addToCart = async (payload: { variantId: number; quantity: number }) => {
    console.log("Adding to cart with payload:", payload);
    const { data } = await axiosInstance.post("/carts/add", payload);
    console.log("Added to cart:", data);
    return data.data as Cart;
};

export const removeFromCart = async (payload: { variantId: number; quantity: number }) => {
    const { data } = await axiosInstance.post("/carts/remove", payload);
    console.log("Removed from cart:", data);
    return data.data as Cart;
};
