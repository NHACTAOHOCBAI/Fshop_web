import type { User } from "@/types/user";

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
    product?: {
        id: number;
        name: string;
        price: number;
        imageUrl?: string;
        images?: {
            id: number;
            imageUrl: string;
        }[];
    };
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
};

export type PinLivestreamProductPayload = {
    productId: number;
    position: number;
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
