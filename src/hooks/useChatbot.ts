import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    AI_CHATBOT_SESSIONS_QUERY_KEY,
    aiChatbotMessagesQueryKey,
    closeAiChatSession,
    createAiChatSession,
    getAiChatMessages,
    listAiChatSessions,
    sendAiChatMessage,
} from "@/services/chatbot";
import type { AiChatMessage, AiChatSession, CreateAiChatSessionPayload, SendAiChatMessagePayload } from "@/types/chatbot";
import type { ApiResponse } from "@/types/response";

export const useAiChatSessions = (enabled = true) => {
    return useQuery({
        queryKey: AI_CHATBOT_SESSIONS_QUERY_KEY,
        queryFn: listAiChatSessions,
        staleTime: 30_000,
        enabled,
    });
};

export const useAiChatMessages = (sessionId?: number, enabled = true) => {
    return useQuery({
        queryKey: aiChatbotMessagesQueryKey(sessionId ?? 0),
        queryFn: () => getAiChatMessages(sessionId!),
        staleTime: 10_000,
        enabled: Boolean(sessionId) && enabled,
    });
};

export const useCreateAiChatSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload?: CreateAiChatSessionPayload) => createAiChatSession(payload),
        onSuccess: (data) => {
            queryClient.setQueryData<ApiResponse<AiChatSession[]>>(
                AI_CHATBOT_SESSIONS_QUERY_KEY,
                (prev) => {
                    const session = data.data;
                    if (!prev) {
                        return { ...data, data: [session] };
                    }
                    return { ...prev, data: [session, ...prev.data] };
                }
            );
        },
    });
};

export const useSendAiChatMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sessionId,
            payload,
        }: {
            sessionId: number;
            payload: SendAiChatMessagePayload;
        }) => sendAiChatMessage(sessionId, payload),
        onSuccess: (data) => {
            const { sessionId, userMessage, assistantMessage } = data.data;
            const messagesKey = aiChatbotMessagesQueryKey(sessionId);

            queryClient.setQueryData<ApiResponse<AiChatMessage[]>>(messagesKey, (prev) => {
                const newMessages = [userMessage, assistantMessage];
                if (!prev) {
                    return { ...data, data: newMessages };
                }
                const filtered = prev.data.filter(
                    (m) => m.id !== userMessage.id && m.id !== assistantMessage.id
                );
                return { ...prev, data: [...filtered, ...newMessages] };
            });

            queryClient.setQueryData<ApiResponse<AiChatSession[]>>(
                AI_CHATBOT_SESSIONS_QUERY_KEY,
                (prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        data: prev.data
                            .map((session) =>
                                session.id === sessionId
                                    ? { ...session, lastMessageAt: assistantMessage.createdAt }
                                    : session
                            )
                            .sort(
                                (a, b) =>
                                    new Date(b.lastMessageAt).getTime() -
                                    new Date(a.lastMessageAt).getTime()
                            ),
                    };
                }
            );
        },
    });
};

export const useCloseAiChatSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: number) => closeAiChatSession(sessionId),
        onSuccess: (_, sessionId) => {
            queryClient.setQueryData<ApiResponse<AiChatSession[]>>(
                AI_CHATBOT_SESSIONS_QUERY_KEY,
                (prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        data: prev.data.filter((session) => session.id !== sessionId),
                    };
                }
            );
            queryClient.removeQueries({ queryKey: aiChatbotMessagesQueryKey(sessionId) });
        },
    });
};
