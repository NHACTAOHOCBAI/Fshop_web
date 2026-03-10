import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from "@/services/categories";
import type { QueryParams } from "@/types/query";

export const useCategories = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["categories", params],
        queryFn: () => getCategories(params || { limit: 10, page: 1 }),
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
    });
};
