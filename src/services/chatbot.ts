import axiosInstance from "@/lib/axios";
import type {
    AiChatMessage,
    AiChatSession,
    CreateAiChatSessionPayload,
    SendAiChatMessagePayload,
    SendAiChatMessageResponse,
} from "@/types/chatbot";
import type { ApiResponse } from "@/types/response";

export const AI_CHATBOT_SESSIONS_QUERY_KEY = ["ai-chatbot", "sessions"] as const;
export const aiChatbotMessagesQueryKey = (sessionId: number) => ["ai-chatbot", "messages", sessionId] as const;

export const createAiChatSession = async (payload?: CreateAiChatSessionPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<AiChatSession>>("/ai-chatbot/sessions", payload ?? {});
    return data;
};

export const listAiChatSessions = async () => {
    const { data } = await axiosInstance.get<ApiResponse<AiChatSession[]>>("/ai-chatbot/sessions");
    return data;
};

export const getAiChatMessages = async (sessionId: number) => {
    const { data } = await axiosInstance.get<ApiResponse<AiChatMessage[]>>(`/ai-chatbot/sessions/${sessionId}/messages`);
    return data;
};

export const sendAiChatMessage = async (sessionId: number, payload: SendAiChatMessagePayload) => {
    const { data } = await axiosInstance.post<ApiResponse<SendAiChatMessageResponse>>(
        `/ai-chatbot/sessions/${sessionId}/messages`,
        payload,
        { timeout: 50_000 }
    );
    return data;
};

export const closeAiChatSession = async (sessionId: number) => {
    const { data } = await axiosInstance.patch<ApiResponse<AiChatSession>>(`/ai-chatbot/sessions/${sessionId}/close`);
    return data;
};

export const deleteAiChatSession = async (sessionId: number) => {
    const { data } = await axiosInstance.delete<ApiResponse<{ deleted: boolean }>>(`/ai-chatbot/sessions/${sessionId}`);
    return data;
};

export const imageSearchInChatSession = async (sessionId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await axiosInstance.post<ApiResponse<SendAiChatMessageResponse>>(
        `/ai-chatbot/sessions/${sessionId}/image-search`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" }, timeout: 40_000 },
    );
    return data;
};

export const voiceSearchInChatSession = async (sessionId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await axiosInstance.post<ApiResponse<SendAiChatMessageResponse>>(
        `/ai-chatbot/sessions/${sessionId}/voice-search`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 },
    );
    return data;
};
