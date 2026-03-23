import axiosInstance from "@/lib/axios";
import type {
    CreateReviewPayload,
    GetReviewsParams,
    ProductReview,
    Review,
    ReviewSummary,
    ReviewVoteResult,
    UpdateReviewPayload,
    VoteReviewPayload,
} from "@/types/review";
import type { ApiResponse } from "@/types/response";

export const getReviews = async (params?: GetReviewsParams) => {
    const { data } = await axiosInstance.get<ApiResponse<Review[]>>("/reviews", {
        params,
    });
    return data;
};

export const getMyReviews = async (params?: GetReviewsParams) => {
    const { data } = await axiosInstance.get<ApiResponse<Review[]>>("/reviews/me", {
        params,
    });
    return data;
};

export const getReviewsByProduct = async (productId: number) => {
    const { data } = await axiosInstance.get<ApiResponse<ProductReview[]>>(`/reviews/product/${productId}`);
    return data;
};

export const getReviewSummary = async (productId: number) => {
    const { data } = await axiosInstance.get<ApiResponse<ReviewSummary>>(`/reviews/summary/${productId}`);
    return data;
};

export const createReview = async (payload: CreateReviewPayload) => {
    const formData = new FormData();
    formData.append("variantId", String(payload.variantId));
    formData.append("orderId", String(payload.orderId));
    formData.append("rating", String(payload.rating));

    if (payload.comment?.trim()) {
        formData.append("comment", payload.comment.trim());
    }

    payload.reviewImages?.forEach((file) => {
        formData.append("reviewImages", file);
    });

    const { data } = await axiosInstance.post<ApiResponse<Review>>("/reviews", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};

export const updateReview = async ({
    id,
    payload,
}: {
    id: number;
    payload: UpdateReviewPayload;
}) => {
    const formData = new FormData();

    if (payload.rating !== undefined) {
        formData.append("rating", String(payload.rating));
    }

    if (payload.comment !== undefined) {
        formData.append("comment", payload.comment);
    }

    payload.reviewImages?.forEach((file) => {
        formData.append("reviewImages", file);
    });

    const { data } = await axiosInstance.patch<ApiResponse<Review>>(`/reviews/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};

export const deleteReview = async (id: number) => {
    const { data } = await axiosInstance.delete<ApiResponse<{ message: string }>>(`/reviews/${id}`);
    return data;
};

export const voteReview = async ({
    id,
    payload,
}: {
    id: number;
    payload: VoteReviewPayload;
}) => {
    const { data } = await axiosInstance.post<ApiResponse<ReviewVoteResult>>(`/reviews/${id}/vote`, payload);
    return data;
};
