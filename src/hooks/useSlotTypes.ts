import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createSlotType,
    deleteSlotType,
    getSlotTypes,
    updateSlotType,
} from "@/services/slotTypes";
import type { QueryParams } from "@/types/query";

export const useSlotTypes = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["slotTypes", params],
        queryFn: () => getSlotTypes(params || { limit: 100, page: 1 }),
    });
};

export const useDeleteSlotType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSlotType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slotTypes"] });
        },
    });
};

export const useCreateSlotType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSlotType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slotTypes"] });
        },
    });
};

export const useUpdateSlotType = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSlotType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["slotTypes"] });
        },
    });
};
