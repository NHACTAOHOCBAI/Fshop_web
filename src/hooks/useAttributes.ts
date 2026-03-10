import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createColor,
    createSize,
    createSizeType,
    deleteColor,
    deleteSize,
    deleteSizeType,
    getColors,
    getSizes,
    getSizeTypes,
    updateColor,
    updateSize,
    updateSizeType,
} from "@/services/attributes";
import type { QueryParams } from "@/types/query";

export const useSizeTypes = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["size-types", params],
        queryFn: () => getSizeTypes(params || { page: 1, limit: 10 }),
    });
};

export const useCreateSizeType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSizeType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["size-types"] });
        },
    });
};

export const useUpdateSizeType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSizeType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["size-types"] });
        },
    });
};

export const useDeleteSizeType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSizeType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["size-types"] });
        },
    });
};

export const useSizes = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["sizes", params],
        queryFn: () => getSizes(params || { page: 1, limit: 10 }),
    });
};

export const useCreateSize = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSize,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sizes"] });
        },
    });
};

export const useUpdateSize = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSize,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sizes"] });
        },
    });
};

export const useDeleteSize = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSize,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sizes"] });
        },
    });
};

export const useColors = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["colors", params],
        queryFn: () => getColors(params || { page: 1, limit: 10 }),
    });
};

export const useCreateColor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createColor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["colors"] });
        },
    });
};

export const useUpdateColor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateColor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["colors"] });
        },
    });
};

export const useDeleteColor = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteColor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["colors"] });
        },
    });
};
