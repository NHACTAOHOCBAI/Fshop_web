import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import {
    createReview,
    deleteReview,
    getMyReviews,
    getReviews,
    getReviewsByProduct,
    getReviewSummary,
    updateReview,
    voteReview,
} from "@/services/reviews";
import type { GetReviewsParams } from "@/types/review";

export const REVIEWS_QUERY_KEY = ["reviews"] as const;

export const useReviews = (params?: GetReviewsParams) => {
    return useQuery({
        queryKey: [...REVIEWS_QUERY_KEY, params],
        queryFn: () => getReviews(params),
    });
};

export const useMyReviews = (params?: GetReviewsParams) => {
    return useQuery({
        queryKey: [...REVIEWS_QUERY_KEY, "me", params],
        queryFn: () => getMyReviews(params),
        enabled: Boolean(authStorage.getAccessToken()),
    });
};

export const useReviewsByProduct = (productId: number, enabled = true) => {
    return useQuery({
        queryKey: [...REVIEWS_QUERY_KEY, "product", productId],
        queryFn: () => getReviewsByProduct(productId),
        enabled: enabled && Number.isFinite(productId) && productId > 0,
    });
};

export const useReviewSummary = (productId: number, enabled = true) => {
    return useQuery({
        queryKey: [...REVIEWS_QUERY_KEY, "summary", productId],
        queryFn: () => getReviewSummary(productId),
        enabled: enabled && Number.isFinite(productId) && productId > 0,
    });
};

export const useCreateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product"] });
            queryClient.invalidateQueries({ queryKey: ["orders", "me"] });
        },
    });
};

export const useUpdateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product"] });
        },
    });
};

export const useDeleteReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["product"] });
        },
    });
};

export const useVoteReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: voteReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: REVIEWS_QUERY_KEY });
        },
        onMutate: () => {
            if (!authStorage.getAccessToken()) {
                throw new Error("Bạn cần đăng nhập để bình chọn đánh giá.");
            }
        },
    });
};
