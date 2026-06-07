import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    AI_CHATBOT_SESSIONS_QUERY_KEY,
    aiChatbotMessagesQueryKey,
    closeAiChatSession,
    createAiChatSession,
    deleteAiChatSession,
    getAiChatMessages,
    imageSearchInChatSession,
    listAiChatSessions,
    sendAiChatMessage,
    voiceSearchInChatSession,
} from "@/services/chatbot";
import type { AiChatMessage, AiChatSession } from "@/types/chatbot";
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
        queryKey: sessionId ? aiChatbotMessagesQueryKey(sessionId) : ["ai-chatbot", "messages", "none"],
        queryFn: () => getAiChatMessages(sessionId as number),
        enabled: enabled && Boolean(sessionId),
        staleTime: 10_000,
    });
};

export const useCreateAiChatSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAiChatSession,
        onSuccess: (response) => {
            queryClient.setQueryData<ApiResponse<AiChatSession[]>>(AI_CHATBOT_SESSIONS_QUERY_KEY, (old) => {
                if (!old) {
                    return {
                        statusCode: 200,
                        message: "success",
                        path: "/ai-chatbot/sessions",
                        data: [response.data],
                    };
                }

                const exists = old.data.some((item) => item.id === response.data.id);
                const nextData = exists
                    ? old.data.map((item) => (item.id === response.data.id ? response.data : item))
                    : [response.data, ...old.data];

                return {
                    ...old,
                    data: nextData,
                };
            });
        },
    });
};

type SendMessageArgs = {
    sessionId: number;
    message: string;
    historyLimit?: number;
};

export const useSendAiChatMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ sessionId, message, historyLimit }: SendMessageArgs) =>
            sendAiChatMessage(sessionId, { message, historyLimit }),
        onSuccess: (response, variables) => {
            const { userMessage, assistantMessage } = response.data;

            queryClient.setQueryData<ApiResponse<AiChatMessage[]>>(aiChatbotMessagesQueryKey(variables.sessionId), (old) => {
                if (!old) {
                    return {
                        statusCode: 200,
                        message: "success",
                        path: `/ai-chatbot/sessions/${variables.sessionId}/messages`,
                        data: [userMessage, assistantMessage],
                    };
                }

                const merged = [...old.data];

                if (!merged.some((item) => item.id === userMessage.id)) {
                    merged.push(userMessage);
                }
                if (!merged.some((item) => item.id === assistantMessage.id)) {
                    merged.push(assistantMessage);
                }

                merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                return {
                    ...old,
                    data: merged,
                };
            });

            queryClient.setQueryData<ApiResponse<AiChatSession[]>>(AI_CHATBOT_SESSIONS_QUERY_KEY, (old) => {
                if (!old) {
                    return old;
                }

                const nextData = old.data
                    .map((session) =>
                        session.id === response.data.sessionId
                            ? {
                                ...session,
                                title: session.title || userMessage.content.slice(0, 80),
                                lastMessageAt: assistantMessage.createdAt,
                                updatedAt: assistantMessage.createdAt,
                            }
                            : session
                    )
                    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

                return {
                    ...old,
                    data: nextData,
                };
            });
        },
    });
};

export const useCloseAiChatSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: closeAiChatSession,
        onSuccess: (_response, sessionId) => {
            queryClient.setQueryData<ApiResponse<AiChatSession[]>>(AI_CHATBOT_SESSIONS_QUERY_KEY, (old) => {
                if (!old) {
                    return old;
                }

                return {
                    ...old,
                    data: old.data.filter((item) => item.id !== sessionId),
                };
            });

            queryClient.removeQueries({ queryKey: aiChatbotMessagesQueryKey(sessionId) });
        },
    });
};

const appendMessagesToCache = (
    queryClient: ReturnType<typeof useQueryClient>,
    sessionId: number,
    userMessage: AiChatMessage,
    assistantMessage: AiChatMessage,
) => {
    queryClient.setQueryData<ApiResponse<AiChatMessage[]>>(aiChatbotMessagesQueryKey(sessionId), (old) => {
        const base = old?.data ?? [];
        const merged = [...base];
        if (!merged.some((m) => m.id === userMessage.id)) merged.push(userMessage);
        if (!merged.some((m) => m.id === assistantMessage.id)) merged.push(assistantMessage);
        merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return old
            ? { ...old, data: merged }
            : { statusCode: 200, message: "success", path: `/ai-chatbot/sessions/${sessionId}/messages`, data: merged };
    });

    queryClient.setQueryData<ApiResponse<AiChatSession[]>>(AI_CHATBOT_SESSIONS_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
            ...old,
            data: old.data
                .map((s) =>
                    s.id === sessionId
                        ? { ...s, title: s.title || userMessage.content.slice(0, 80), lastMessageAt: assistantMessage.createdAt }
                        : s
                )
                .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
        };
    });
};

type MediaSearchArgs = { sessionId: number; file: File; previewImageUri?: string };

export const useImageSearchInChatSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sessionId, file }: MediaSearchArgs) => imageSearchInChatSession(sessionId, file),
        onSuccess: (response, variables) => {
            const { sessionId, userMessage, assistantMessage } = response.data;
            const userMessageWithImage = variables.previewImageUri
                ? {
                    ...userMessage,
                    metadata: {
                        ...(userMessage.metadata ?? {}),
                        mediaType: "image" as const,
                        imageUri: userMessage.metadata?.imageUri ?? variables.previewImageUri,
                        fileName: userMessage.metadata?.fileName ?? variables.file.name,
                    },
                }
                : userMessage;
            appendMessagesToCache(queryClient, sessionId, userMessageWithImage, assistantMessage);
        },
    });
};

export const useVoiceSearchInChatSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sessionId, file }: MediaSearchArgs) => voiceSearchInChatSession(sessionId, file),
        onSuccess: (response) => {
            const { sessionId, userMessage, assistantMessage } = response.data;
            appendMessagesToCache(queryClient, sessionId, userMessage, assistantMessage);
        },
    });
};

export const useDeleteAiChatSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAiChatSession,
        onSuccess: (_response, sessionId) => {
            queryClient.setQueryData<ApiResponse<AiChatSession[]>>(AI_CHATBOT_SESSIONS_QUERY_KEY, (old) => {
                if (!old) return old;
                return { ...old, data: old.data.filter((item) => item.id !== sessionId) };
            });

            queryClient.removeQueries({ queryKey: aiChatbotMessagesQueryKey(sessionId) });
        },
    });
};
