import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createProduct, deleteProduct, getProductById, getProducts } from "@/services/products";
import type { QueryParams } from "@/types/query";

export const useProducts = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["products", params],
        queryFn: () => getProducts(params || { limit: 10, page: 1 }),
    });
};

export const useProductById = (id: number, enabled = true) => {
    return useQuery({
        queryKey: ["product", id],
        queryFn: () => getProductById(id),
        enabled: enabled && Number.isFinite(id) && id > 0,
    });
};

export const useRelatedProducts = (categoryId?: number, excludedId?: number) => {
    const productsQuery = useProducts({
        page: 1,
        limit: 80,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    const relatedProducts = (productsQuery.data?.data.data ?? [])
        .filter((product) => {
            if (!categoryId) {
                return false;
            }

            if (excludedId && product.id === excludedId) {
                return false;
            }

            return product.categoryId === categoryId;
        })
        .slice(0, 4);

    return {
        ...productsQuery,
        relatedProducts,
    };
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
