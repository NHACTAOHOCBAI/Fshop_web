import type { User } from "@/types/user";
import type { Product } from "@/types/product";

export type LivestreamStatus = "scheduled" | "live" | "ended";

export type Livestream = {
    id: number;
    hostId: number;
    title: string;
    description?: string;
    coverImageUrl?: string;
    coverImagePublicId?: string;
    agoraChannel: string;
    status: LivestreamStatus;
    scheduledStartAt: string;
    startedAt?: string;
    endedAt?: string;
    viewerCount: number;
    totalViewers: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    host?: User;
};

export type LivestreamProduct = {
    id: number;
    livestreamId: number;
    productId: number;
    position: number;
    unitsSold: number;
    createdAt: string;
    product?: Product;
};

export type LivestreamDetail = Livestream & {
    pinnedProducts: LivestreamProduct[];
};

export type LivestreamComment = {
    id: number;
    livestreamId: number;
    userId: number;
    content: string;
    likeCount: number;
    isActive: boolean;
    createdAt: string;
    user?: Pick<User, "id" | "fullName" | "avatar" | "role">;
};

export type GetLivestreamsParams = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    status?: LivestreamStatus;
};

export type CreateLivestreamPayload = {
    title: string;
    description?: string;
    scheduledStartAt: string;
    coverImage?: File;
};

export type UpdateLivestreamPayload = {
    title?: string;
    description?: string;
    scheduledStartAt?: string;
    coverImage?: File;
    isActive?: boolean;
};

export type PinLivestreamProductPayload = {
    productId: number;
    position: number;
};

export type PinLivestreamProductsBatchPayload = {
    productIds: number[];
};

export type CreateLivestreamCommentPayload = {
    content: string;
};

export type AgoraTokenPayload = {
    token: string;
    channel: string;
    uid: number;
    role: "publisher" | "subscriber";
    expiresAt: number;
};

export type LivestreamSummaryProduct = {
    productId: number;
    name: string;
    imageUrl?: string;
    unitsSold: number;
    revenue: number;
};

export type LivestreamSummary = {
    livestreamId: number;
    title: string;
    status: LivestreamStatus;
    scheduledStartAt: string;
    startedAt?: string;
    endedAt?: string;
    durationSeconds: number | null;
    totalViewers: number;
    totalComments: number;
    totalOrders: number;
    totalRevenue: number;
    topProducts: LivestreamSummaryProduct[];
};
