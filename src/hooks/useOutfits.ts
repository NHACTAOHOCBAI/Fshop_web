import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CART_QUERY_KEY } from "@/hooks/useCart";
import {
    addOutfitToCart,
    createOutfit,
    deleteOutfit,
    getMyOutfits,
    getOutfitById,
    updateOutfit,
} from "@/services/outfits";

export const OUTFITS_QUERY_KEY = ["outfits", "me"] as const;

export const useMyOutfits = (enabled = true) => {
    return useQuery({
        queryKey: OUTFITS_QUERY_KEY,
        queryFn: getMyOutfits,
        enabled,
        retry: false,
    });
};

export const useOutfitById = (id?: number, enabled = true) => {
    return useQuery({
        queryKey: ["outfits", id],
        queryFn: () => getOutfitById(id as number),
        enabled: enabled && Number.isFinite(id) && Number(id) > 0,
    });
};

export const useCreateOutfit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createOutfit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: OUTFITS_QUERY_KEY });
        },
    });
};

export const useUpdateOutfit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateOutfit,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: OUTFITS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["outfits", variables.id] });
        },
    });
};

export const useDeleteOutfit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteOutfit,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: OUTFITS_QUERY_KEY });
        },
    });
};

export const useAddOutfitToCart = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addOutfitToCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
        },
    });
};
