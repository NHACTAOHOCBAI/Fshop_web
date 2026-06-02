export type DecimalValue = number | string;

export type Review = {
    id: number;
    userId: number;
    orderId: number;
    variantId: number;
    rating: DecimalValue;
    comment?: string | null;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
};

export type ReviewVoteResult = {
    message: string;
    reviewId: number;
    userId: number;
    isHelpful: boolean;
};

export type ProductReview = {
    id: number;
    rating: DecimalValue;
    comment?: string | null;
    user: {
        id: number;
        name: string;
    };
    images: string[];
    helpfulCount: number;
    createdAt: string;
    variantName?: string;
    quantity?: number;
};

export type ReviewSummary = {
    productId: number;
    reviewCount: number;
    averageRating: number;
    distribution: Record<string, number>;
};

export type GetReviewsParams = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
};

export type CreateReviewPayload = {
    variantId: number;
    orderId: number;
    rating: number;
    comment?: string;
    reviewImages?: File[];
};

export type UpdateReviewPayload = {
    rating?: number;
    comment?: string;
    reviewImages?: File[];
};

export type VoteReviewPayload = {
    isHelpful?: boolean;
};
