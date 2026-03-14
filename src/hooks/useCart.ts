import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { addToCart, getMyCart, removeFromCart } from "@/services/carts";

export const CART_QUERY_KEY = ["cart", "me"];

export const useCart = () => {
    return useQuery({
        queryKey: CART_QUERY_KEY,
        queryFn: getMyCart,
        retry: false,
    });
};

export const useAddToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addToCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
        },
    });
};

export const useRemoveFromCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeFromCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
        },
    });
};
