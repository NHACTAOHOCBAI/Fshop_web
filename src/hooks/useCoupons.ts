import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createCoupon, deleteCoupon, getCouponById, getCoupons, updateCoupon } from "@/services/coupons";
import type { QueryParams } from "@/types/query";

export const useCoupons = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["coupons", params],
        queryFn: () => getCoupons(params || { limit: 10, page: 1 }),
    });
};

export const useCreateCoupon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCoupon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};

export const useCouponById = (id: number, enabled = true) => {
    return useQuery({
        queryKey: ["coupon", id],
        queryFn: () => getCouponById(id),
        enabled: enabled && Number.isFinite(id) && id > 0,
    });
};

export const useUpdateCoupon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateCoupon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};

export const useDeleteCoupon = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCoupon,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};
