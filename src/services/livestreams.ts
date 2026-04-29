import { io, type Socket } from "socket.io-client";

import axiosInstance from "@/lib/axios";
import { resolveSocketBaseUrl } from "@/lib/socket";
import type {
    AgoraTokenPayload,
    CreateLivestreamCommentPayload,
    CreateLivestreamPayload,
    GetLivestreamsParams,
    Livestream,
    LivestreamComment,
    LivestreamDetail,
    LivestreamProduct,
    LivestreamSummary,
    PinLivestreamProductPayload,
    UpdateLivestreamPayload,
} from "@/types/livestream";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

export const LIVESTREAMS_QUERY_KEY = ["livestreams"] as const;
export const livestreamByIdQueryKey = (id: number) => [...LIVESTREAMS_QUERY_KEY, id] as const;
export const livestreamCommentsQueryKey = (id: number, params?: GetLivestreamsParams) =>
    [...LIVESTREAMS_QUERY_KEY, id, "comments", params] as const;

const API_BASE = "/livestreams";

export const getLivestreams = async (params?: GetLivestreamsParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Livestream>>(API_BASE, {
        params,
    });
    return data;
};

export const getLivestreamById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<LivestreamDetail>>(`${API_BASE}/${id}`);
    return data;
};

export const createLivestream = async (payload: CreateLivestreamPayload) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("scheduledStartAt", payload.scheduledStartAt);

    if (payload.description?.trim()) {
        formData.append("description", payload.description.trim());
    }

    if (payload.coverImage) {
        formData.append("coverImage", payload.coverImage);
    }

    const { data } = await axiosInstance.post<ApiResponse<Livestream>>(API_BASE, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
};

export const updateLivestream = async (id: number, payload: UpdateLivestreamPayload) => {
    const formData = new FormData();

    if (payload.title !== undefined) {
        formData.append("title", payload.title);
    }
    if (payload.description !== undefined) {
        formData.append("description", payload.description);
    }
    if (payload.scheduledStartAt !== undefined) {
        formData.append("scheduledStartAt", payload.scheduledStartAt);
    }
    if (payload.coverImage) {
        formData.append("coverImage", payload.coverImage);
    }

    const { data } = await axiosInstance.patch<ApiResponse<Livestream>>(`${API_BASE}/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
};

export const startLivestream = async (id: number) => {
    const { data } = await axiosInstance.post<ApiResponse<Livestream>>(`${API_BASE}/${id}/go-live`);
    return data;
};

export const endLivestream = async (id: number) => {
    const { data } = await axiosInstance.post<ApiResponse<Livestream>>(`${API_BASE}/${id}/end`);
    return data;
};

export const pinLivestreamProduct = async (id: number, payload: PinLivestreamProductPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<LivestreamProduct>>(
        `${API_BASE}/${id}/products`,
        payload,
    );
    return data;
};

export const unpinLivestreamProduct = async (id: number, productId: number) => {
    const { data } = await axiosInstance.delete<ApiResponse<{ success: boolean }>>(
        `${API_BASE}/${id}/products/${productId}`,
    );
    return data;
};

export const getLivestreamComments = async (id: number, params?: GetLivestreamsParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<LivestreamComment>>(
        `${API_BASE}/${id}/comments`,
        { params },
    );
    return data;
};

export const createLivestreamComment = async (id: number, payload: CreateLivestreamCommentPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<LivestreamComment>>(
        `${API_BASE}/${id}/comments`,
        payload,
    );
    return data;
};

export const issueLivestreamAgoraToken = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<AgoraTokenPayload>>(`${API_BASE}/${id}/agora-token`);
    return data;
};

export const livestreamSummaryQueryKey = (id: number) => [...LIVESTREAMS_QUERY_KEY, id, "summary"] as const;

export const getLivestreamSummary = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<LivestreamSummary>>(`${API_BASE}/${id}/summary`);
    return data;
};

export const connectLivestreamSocket = (accessToken: string): Socket => {
    return io(resolveSocketBaseUrl(), {
        transports: ["websocket"],
        auth: { token: accessToken },
        reconnection: true,
    });
};
