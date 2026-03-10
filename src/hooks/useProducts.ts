import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createProduct, deleteProduct, getProducts } from "@/services/products";
import type { QueryParams } from "@/types/query";

export const useProducts = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["products", params],
        queryFn: () => getProducts(params || { limit: 10, page: 1 }),
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};
