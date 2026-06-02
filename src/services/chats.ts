import { io, type Socket } from "socket.io-client";

import axiosInstance from "@/lib/axios";
import { resolveSocketBaseUrl } from "@/lib/socket";
import type { ChatConversation, ChatMessage, SendChatMessagePayload } from "@/types/chat";
import type { ApiResponse } from "@/types/response";

export const CHAT_CONVERSATION_QUERY_KEY = ["chats", "conversation"] as const;
export const CHAT_ADMIN_CONVERSATIONS_QUERY_KEY = ["chats", "admin", "conversations"] as const;

export const chatMessagesQueryKey = (conversationId: number) => ["chats", "messages", conversationId] as const;

export const getOrCreateConversation = async () => {
    const { data } = await axiosInstance.post<ApiResponse<ChatConversation>>("/chats/conversation");
    return data;
};

export const getConversationMessages = async (conversationId: number) => {
    const { data } = await axiosInstance.get<ApiResponse<ChatMessage[]>>(`/chats/conversations/${conversationId}/messages`);
    return data;
};

export const getAdminConversations = async () => {
    const { data } = await axiosInstance.get<ApiResponse<ChatConversation[]>>("/chats/admin/conversations");
    return data;
};

export const sendChatMessage = async (payload: SendChatMessagePayload) => {
    const formData = new FormData();

    formData.append("conversationId", String(payload.conversationId));

    if (payload.content?.trim()) {
        formData.append("content", payload.content.trim());
    }

    payload.images?.forEach((file) => {
        formData.append("images", file);
    });

    if (payload.voice) {
        formData.append("voice", payload.voice);
    }

    if (payload.video) {
        formData.append("video", payload.video);
    }

    if (payload.productIds && payload.productIds.length > 0) {
        formData.append("productIds", JSON.stringify(payload.productIds));
    }

    if (payload.orderIds && payload.orderIds.length > 0) {
        formData.append("orderIds", JSON.stringify(payload.orderIds));
    }

    const { data } = await axiosInstance.post<ApiResponse<ChatMessage>>("/chats/send", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        timeout: 300000,
    });

    return data;
};

export const markConversationAsSeen = async (conversationId: number) => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(`/chats/seen/${conversationId}`);
    return data;
};

export const connectChatsSocket = (accessToken: string): Socket => {
    return io(resolveSocketBaseUrl(), {
        transports: ["websocket"],
        auth: { token: accessToken },
        reconnection: true,
    });
};
