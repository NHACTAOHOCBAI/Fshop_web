import axiosInstance from "@/lib/axios";
import type { Coupon, GetBestPublicCouponPayload, UpsertCouponPayload } from "@/types/coupon";
import type { QueryParams } from "@/types/query";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

export const getCoupons = async ({ limit, page, search, sortOrder, sortBy }: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Coupon>>("/coupons/all", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const getBestPublicCoupons = async (payload: GetBestPublicCouponPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<Coupon[]>>("/coupons/best-public", payload);
    return data;
};

export const createCoupon = async (payload: UpsertCouponPayload) => {
    return axiosInstance.post<ApiResponse<Coupon>>("/coupons", payload);
};

export const getCouponById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Coupon>>(`/coupons/${id}`);
    return data;
};

export const updateCoupon = async ({ id, payload }: { id: number; payload: UpsertCouponPayload }) => {
    return axiosInstance.patch<ApiResponse<Coupon>>(`/coupons/${id}`, payload);
};

export const deleteCoupon = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/coupons/${id}`);
};
