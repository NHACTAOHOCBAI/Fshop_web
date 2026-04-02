import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import {
    CHAT_CONVERSATION_QUERY_KEY,
    CHAT_ADMIN_CONVERSATIONS_QUERY_KEY,
    chatMessagesQueryKey,
    connectChatsSocket,
    getAdminConversations,
    getConversationMessages,
    getOrCreateConversation,
    markConversationAsSeen,
    sendChatMessage,
} from "@/services/chats";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import type { ApiResponse } from "@/types/response";

export const useSupportConversation = (enabled = true) => {
    return useQuery({
        queryKey: CHAT_CONVERSATION_QUERY_KEY,
        queryFn: getOrCreateConversation,
        enabled: enabled && Boolean(authStorage.getAccessToken()),
        staleTime: 30_000,
    });
};

export const useAdminConversations = (enabled = true) => {
    return useQuery({
        queryKey: CHAT_ADMIN_CONVERSATIONS_QUERY_KEY,
        queryFn: getAdminConversations,
        enabled: enabled && Boolean(authStorage.getAccessToken()),
        staleTime: 10_000,
    });
};

export const useConversationMessages = (conversationId?: number, enabled = true) => {
    return useQuery({
        queryKey: conversationId ? chatMessagesQueryKey(conversationId) : ["chats", "messages", "none"],
        queryFn: () => getConversationMessages(conversationId as number),
        enabled: enabled && Boolean(conversationId),
        staleTime: 10_000,
    });
};

export const useSendChatMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: sendChatMessage,
        onSuccess: (response) => {
            const message = response.data;

            queryClient.setQueryData<ApiResponse<ChatMessage[]>>(chatMessagesQueryKey(message.conversationId), (old) => {
                if (!old) {
                    return old;
                }

                const exists = old.data.some((item) => item.id === message.id);
                const nextData = exists
                    ? old.data.map((item) => (item.id === message.id ? message : item))
                    : [...old.data, message];

                return {
                    ...old,
                    data: nextData,
                };
            });

            queryClient.setQueryData<ApiResponse<ChatConversation>>(CHAT_CONVERSATION_QUERY_KEY, (old) => {
                if (!old || old.data.id !== message.conversationId) {
                    return old;
                }

                return {
                    ...old,
                    data: {
                        ...old.data,
                        lastMessageAt: message.createdAt,
                    },
                };
            });
        },
    });
};

export const useMarkConversationSeen = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: markConversationAsSeen,
        onSuccess: (_response, conversationId) => {
            queryClient.setQueryData<ApiResponse<ChatMessage[]>>(chatMessagesQueryKey(conversationId), (old) => {
                if (!old) {
                    return old;
                }

                return {
                    ...old,
                    data: old.data.map((message) => ({
                        ...message,
                        isSeen: true,
                    })),
                };
            });
        },
    });
};

export const useAdminChatRealtime = (enabled = true) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const accessToken = authStorage.getAccessToken();
        if (!accessToken) {
            return;
        }

        const socket = connectChatsSocket(accessToken);

        const handleConversationUpdated = () => {
            queryClient.invalidateQueries({ queryKey: CHAT_ADMIN_CONVERSATIONS_QUERY_KEY });
        };

        socket.on("conversationUpdated", handleConversationUpdated);

        return () => {
            socket.off("conversationUpdated", handleConversationUpdated);
            socket.disconnect();
        };
    }, [enabled, queryClient]);
};

type UseChatRealtimeOptions = {
    conversationId?: number;
    enabled?: boolean;
    currentUserId?: number;
    onAdminMessageReceived?: (message: ChatMessage) => void;
};

export const useChatRealtime = ({
    conversationId,
    enabled = true,
    currentUserId,
    onAdminMessageReceived,
}: UseChatRealtimeOptions) => {
    const queryClient = useQueryClient();
    const socketRef = useRef<ReturnType<typeof connectChatsSocket> | null>(null);
    const onAdminMessageReceivedRef = useRef(onAdminMessageReceived);
    const [isSupportTyping, setIsSupportTyping] = useState(false);

    useEffect(() => {
        onAdminMessageReceivedRef.current = onAdminMessageReceived;
    }, [onAdminMessageReceived]);

    useEffect(() => {
        if (!enabled || !conversationId) {
            return;
        }

        const accessToken = authStorage.getAccessToken();
        if (!accessToken) {
            return;
        }

        const socket = connectChatsSocket(accessToken);
        socketRef.current = socket;

        const joinConversation = () => {
            socket.emit("joinConversation", conversationId);
        };

        socket.on("connect", joinConversation);
        joinConversation();

        const handleNewMessage = (incoming: ChatMessage) => {
            if (incoming.conversationId !== conversationId) {
                return;
            }

            setIsSupportTyping(false);

            queryClient.setQueryData<ApiResponse<ChatMessage[]>>(chatMessagesQueryKey(conversationId), (old) => {
                if (!old) {
                    return old;
                }

                const exists = old.data.some((item) => item.id === incoming.id);
                const nextData = exists
                    ? old.data.map((item) => (item.id === incoming.id ? incoming : item))
                    : [...old.data, incoming];

                return {
                    ...old,
                    data: nextData,
                };
            });

            queryClient.setQueryData<ApiResponse<ChatConversation>>(CHAT_CONVERSATION_QUERY_KEY, (old) => {
                if (!old || old.data.id !== incoming.conversationId) {
                    return old;
                }

                return {
                    ...old,
                    data: {
                        ...old.data,
                        lastMessageAt: incoming.createdAt,
                        status: incoming.senderRole === "admin" ? "HANDLING" : old.data.status,
                        assignedAdmin:
                            incoming.senderRole === "admin"
                                ? {
                                      id: incoming.sender.id,
                                      fullName: incoming.sender.fullName,
                                      avatar: incoming.sender.avatar,
                                      role: incoming.sender.role,
                                  }
                                : old.data.assignedAdmin,
                    },
                };
            });

            if (incoming.senderRole === "admin" && incoming.sender.id !== currentUserId) {
                onAdminMessageReceivedRef.current?.(incoming);
            }
        };

        const handleTyping = (data: { conversationId: number; userId: number; isTyping: boolean }) => {
            if (data.conversationId !== conversationId || data.userId === currentUserId) {
                return;
            }

            setIsSupportTyping(data.isTyping);
        };

        const handleSeen = () => {
            queryClient.setQueryData<ApiResponse<ChatMessage[]>>(chatMessagesQueryKey(conversationId), (old) => {
                if (!old) {
                    return old;
                }

                return {
                    ...old,
                    data: old.data.map((message) => ({
                        ...message,
                        isSeen: true,
                    })),
                };
            });
        };

        const handleConversationUpdated = (incoming: ChatConversation) => {
            if (incoming.id !== conversationId) {
                return;
            }

            queryClient.setQueryData<ApiResponse<ChatConversation>>(CHAT_CONVERSATION_QUERY_KEY, (old) => {
                if (!old || old.data.id !== incoming.id) {
                    return old;
                }

                return {
                    ...old,
                    data: incoming,
                };
            });
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("typing", handleTyping);
        socket.on("seen", handleSeen);
        socket.on("conversationUpdated", handleConversationUpdated);

        return () => {
            socket.emit("leaveConversation", conversationId);
            socket.off("connect", joinConversation);
            socket.off("newMessage", handleNewMessage);
            socket.off("typing", handleTyping);
            socket.off("seen", handleSeen);
            socket.off("conversationUpdated", handleConversationUpdated);
            socket.disconnect();
            socketRef.current = null;
            setIsSupportTyping(false);
        };
    }, [conversationId, currentUserId, enabled, queryClient]);

    const emitTyping = (isTyping: boolean) => {
        if (!conversationId || !currentUserId || !socketRef.current) {
            return;
        }

        socketRef.current.emit("typing", {
            conversationId,
            userId: currentUserId,
            isTyping,
        });
    };

    return {
        isSupportTyping,
        emitTyping,
    };
};
