import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBrand, deleteBrand, getBrands, updateBrand } from "@/services/brands";
import type { QueryParams } from "@/types/query";

export const useBrands = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["brands", params],
        queryFn: () => getBrands(params || { limit: 10, page: 1 }),
    });
};

export const useDeleteBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
    });
};

export const useCreateBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
    });
};

export const useUpdateBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
    });
};
