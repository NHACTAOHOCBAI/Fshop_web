import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createProduct,
    createProductTryonAsset,
    deleteProduct,
    deleteProductTryonAsset,
    getProductById,
    getProducts,
    getProductTryonAssets,
    updateProduct,
    updateProductFull,
    updateProductTryonAsset,
    virtualTryon2D,
    virtualTryonOutfit,
} from "@/services/products";
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

export const useProductTryonAssets = (productId: number, enabled = true) => {
    return useQuery({
        queryKey: ["product-tryon-assets", productId],
        queryFn: () => getProductTryonAssets(productId),
        enabled: enabled && Number.isFinite(productId) && productId > 0,
    });
};

export const useRelatedProducts = (categoryId?: number, excludedId?: number) => {
    const productsQuery = useProducts({
        page: 1,
        limit: 80,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    const relatedProducts = (productsQuery.data?.data ?? [])
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

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProduct,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
        },
    });
};

export const useUpdateProductFull = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProductFull,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
        },
    });
};

export const useCreateProductTryonAsset = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProductTryonAsset,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["product-tryon-assets", variables.productId] });
        },
    });
};

export const useUpdateProductTryonAsset = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProductTryonAsset,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["product-tryon-assets", variables.productId] });
        },
    });
};

export const useDeleteProductTryonAsset = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProductTryonAsset,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["product-tryon-assets", variables.productId] });
        },
    });
};

export const useVirtualTryon2D = () => {
    return useMutation({
        mutationFn: ({
            productId,
            personImage,
            garmentDesc,
        }: {
            productId: number;
            personImage: File;
            garmentDesc?: string;
        }) => virtualTryon2D(productId, personImage, garmentDesc),
    });
};

export const useVirtualTryonOutfit = () => {
    return useMutation({
        mutationFn: ({
            personImage,
            productIds,
            stylePrompt,
        }: {
            personImage: File;
            productIds: number[];
            stylePrompt?: string;
        }) => virtualTryonOutfit(personImage, productIds, stylePrompt),
    });
};
