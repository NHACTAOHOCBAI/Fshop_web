import { useEffect, useRef } from "react";
import type React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import {
    connectLivestreamSocket,
    createLivestream,
    createLivestreamComment,
    endLivestream,
    getLivestreamById,
    getLivestreamComments,
    getLivestreams,
    getLivestreamSummary,
    issueLivestreamAgoraToken,
    LIVESTREAMS_QUERY_KEY,
    livestreamByIdQueryKey,
    livestreamCommentsQueryKey,
    livestreamSummaryQueryKey,
    pinLivestreamProduct,
    pinLivestreamProductsBatch,
    startLivestream,
    unpinLivestreamProduct,
    updateLivestream,
    createPoll,
    closePoll,
    getActivePoll,
} from "@/services/livestreams";
import type {
    GetLivestreamsParams,
    Livestream,
    LivestreamComment,
    LivestreamDetail,
    LivestreamPoll,
    PollVoteResult,
    PollClosedPayload,
} from "@/types/livestream";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

const livestreamCommentsPrefixQueryKey = (id: number) => [...LIVESTREAMS_QUERY_KEY, id, "comments"] as const;

const applyViewerCountToCaches = (
    queryClient: ReturnType<typeof useQueryClient>,
    livestreamId: number,
    nextViewerCount: number,
) => {
    queryClient.setQueryData<ApiResponse<LivestreamDetail>>(livestreamByIdQueryKey(livestreamId), (old) => {
        if (!old) return old;
        return {
            ...old,
            data: {
                ...old.data,
                viewerCount: nextViewerCount,
                totalViewers: Math.max(old.data.totalViewers, nextViewerCount),
            },
        };
    });

    queryClient.setQueriesData<PaginatedApiResponse<Livestream>>(
        { queryKey: LIVESTREAMS_QUERY_KEY },
        (old) => {
            if (!old) return old;
            if (!Array.isArray(old.data)) return old;

            const isLivestreamList = old.data.every(
                (item) =>
                    item &&
                    typeof item === "object" &&
                    typeof (item as Partial<Livestream>).viewerCount === "number" &&
                    typeof (item as Partial<Livestream>).totalViewers === "number",
            );
            if (!isLivestreamList) return old;

            return {
                ...old,
                data: old.data.map((item) =>
                    item.id === livestreamId
                        ? {
                              ...item,
                              viewerCount: nextViewerCount,
                              totalViewers: Math.max(item.totalViewers, nextViewerCount),
                          }
                        : item,
                ),
            };
        },
    );
};

const sortCommentsAsc = (comments: LivestreamComment[]) => {
    return comments.slice().sort((a, b) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id - b.id;
    });
};

const upsertComment = (comments: LivestreamComment[], incoming: LivestreamComment) => {
    const existingComment = comments.find((item) => item.id === incoming.id);
    const normalizedIncoming =
        incoming.user || !existingComment?.user
            ? incoming
            : {
                  ...incoming,
                  user: existingComment.user,
              };
    const exists = Boolean(existingComment);
    if (exists) {
        return {
            exists,
            data: sortCommentsAsc(
                comments.map((item) => (item.id === normalizedIncoming.id ? normalizedIncoming : item)),
            ),
        };
    }

    return {
        exists,
        data: sortCommentsAsc([...comments, normalizedIncoming]),
    };
};

export const useLivestreams = (params?: GetLivestreamsParams) => {
    return useQuery({
        queryKey: [...LIVESTREAMS_QUERY_KEY, params],
        queryFn: () => getLivestreams(params),
    });
};

export const useLivestreamById = (id: number | null, enabled = true) => {
    return useQuery({
        queryKey: id ? livestreamByIdQueryKey(id) : [...LIVESTREAMS_QUERY_KEY, "none"],
        queryFn: () => getLivestreamById(id as number),
        enabled: enabled && Boolean(id),
    });
};

export const useCreateLivestream = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createLivestream,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: LIVESTREAMS_QUERY_KEY });
        },
    });
};

export const useUpdateLivestream = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateLivestream>[1] }) =>
            updateLivestream(id, payload),
        onSuccess: (response, variables) => {
            queryClient.invalidateQueries({ queryKey: LIVESTREAMS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: livestreamByIdQueryKey(variables.id) });

            queryClient.setQueryData<ApiResponse<LivestreamDetail>>(livestreamByIdQueryKey(variables.id), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        ...response.data,
                    },
                };
            });
        },
    });
};

export const useStartLivestream = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: startLivestream,
        onSuccess: (response, id) => {
            queryClient.invalidateQueries({ queryKey: LIVESTREAMS_QUERY_KEY });
            queryClient.setQueryData<ApiResponse<LivestreamDetail>>(livestreamByIdQueryKey(id), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        ...response.data,
                    },
                };
            });
        },
    });
};

export const useEndLivestream = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: endLivestream,
        onSuccess: (response, id) => {
            queryClient.invalidateQueries({ queryKey: LIVESTREAMS_QUERY_KEY });
            queryClient.setQueryData<ApiResponse<LivestreamDetail>>(livestreamByIdQueryKey(id), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        ...response.data,
                    },
                };
            });
        },
    });
};

export const usePinLivestreamProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof pinLivestreamProduct>[1] }) =>
            pinLivestreamProduct(id, payload),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({ queryKey: livestreamByIdQueryKey(id) });
        },
    });
};

export const usePinLivestreamProductsBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof pinLivestreamProductsBatch>[1] }) =>
            pinLivestreamProductsBatch(id, payload),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({ queryKey: livestreamByIdQueryKey(id) });
        },
    });
};

export const useUnpinLivestreamProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, productId }: { id: number; productId: number }) =>
            unpinLivestreamProduct(id, productId),
        onSuccess: (_response, { id }) => {
            queryClient.invalidateQueries({ queryKey: livestreamByIdQueryKey(id) });
        },
    });
};

export const useLivestreamComments = (id: number | null, params?: GetLivestreamsParams, enabled = true) => {
    return useQuery({
        queryKey: id ? livestreamCommentsQueryKey(id, params) : [...LIVESTREAMS_QUERY_KEY, "comments", "none"],
        queryFn: () => getLivestreamComments(id as number, params),
        enabled: enabled && Boolean(id),
    });
};

export const useCreateLivestreamComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof createLivestreamComment>[1] }) =>
            createLivestreamComment(id, payload),
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: livestreamCommentsPrefixQueryKey(id) });

            const currentUser = authStorage.getUser<{
                id: number;
                fullName: string | null;
                avatar: string | null;
                role: "admin" | "user";
            }>();

            const tempId = -Date.now();
            const optimisticComment: LivestreamComment = {
                id: tempId,
                livestreamId: id,
                userId: currentUser?.id ?? 0,
                content: payload.content,
                likeCount: 0,
                isActive: true,
                createdAt: new Date().toISOString(),
                user: currentUser
                    ? {
                          id: currentUser.id,
                          fullName: currentUser.fullName,
                          avatar: currentUser.avatar,
                          role: currentUser.role,
                      }
                    : undefined,
            };

            queryClient.setQueriesData<PaginatedApiResponse<LivestreamComment>>(
                { queryKey: livestreamCommentsPrefixQueryKey(id) },
                (old) => {
                    if (!old) return old;

                    const { data, exists } = upsertComment(old.data, optimisticComment);
                    const nextMeta =
                        old.meta?.pagination && typeof old.meta.pagination.total === "number" && !exists
                            ? {
                                  ...old.meta,
                                  pagination: {
                                      ...old.meta.pagination,
                                      total: old.meta.pagination.total + 1,
                                  },
                              }
                            : old.meta;

                    return {
                        ...old,
                        data,
                        meta: nextMeta,
                    };
                },
            );

            return { livestreamId: id, tempId };
        },
        onError: (_error, _variables, context) => {
            if (!context) return;

            queryClient.setQueriesData<PaginatedApiResponse<LivestreamComment>>(
                { queryKey: livestreamCommentsPrefixQueryKey(context.livestreamId) },
                (old) => {
                    if (!old) return old;

                    const existed = old.data.some((item) => item.id === context.tempId);
                    const nextData = old.data.filter((item) => item.id !== context.tempId);
                    const nextMeta =
                        old.meta?.pagination && typeof old.meta.pagination.total === "number" && existed
                            ? {
                                  ...old.meta,
                                  pagination: {
                                      ...old.meta.pagination,
                                      total: Math.max(0, old.meta.pagination.total - 1),
                                  },
                              }
                            : old.meta;

                    return {
                        ...old,
                        data: nextData,
                        meta: nextMeta,
                    };
                },
            );
        },
        onSuccess: (response, variables, context) => {
            queryClient.setQueriesData<PaginatedApiResponse<LivestreamComment>>(
                { queryKey: livestreamCommentsPrefixQueryKey(variables.id) },
                (old) => {
                    if (!old) return old;

                    const commentFromServer = response.data;
                    const hasOptimistic =
                        context?.tempId !== undefined &&
                        old.data.some((item) => item.id === context.tempId);
                    const optimisticComment =
                        context?.tempId !== undefined
                            ? old.data.find((item) => item.id === context.tempId)
                            : undefined;
                    const resolvedServerComment =
                        commentFromServer.user || !optimisticComment?.user
                            ? commentFromServer
                            : {
                                  ...commentFromServer,
                                  user: optimisticComment.user,
                              };

                    const withoutOptimistic = hasOptimistic
                        ? old.data.filter((item) => item.id !== context.tempId)
                        : old.data;

                    const { data, exists } = upsertComment(withoutOptimistic, resolvedServerComment);
                    const nextMeta =
                        old.meta?.pagination && typeof old.meta.pagination.total === "number" && !exists && !hasOptimistic
                            ? {
                                  ...old.meta,
                                  pagination: {
                                      ...old.meta.pagination,
                                      total: old.meta.pagination.total + 1,
                                  },
                              }
                            : old.meta;

                    return {
                        ...old,
                        data,
                        meta: nextMeta,
                    };
                },
            );
        },
    });
};

export const useIssueLivestreamAgoraToken = () => {
    return useMutation({
        mutationFn: issueLivestreamAgoraToken,
    });
};

type UseLivestreamRealtimeOptions = {
    livestreamId?: number;
    enabled?: boolean;
    onViewerCountUpdated?: (count: number) => void;
    onPollCreated?: (poll: LivestreamPoll) => void;
    onPollUpdated?: (result: PollVoteResult) => void;
    onPollClosed?: (payload: PollClosedPayload) => void;
    emitRef?: React.MutableRefObject<((event: string, data: unknown) => void) | null>;
};

export const useLivestreamRealtime = ({
    livestreamId,
    enabled = true,
    onViewerCountUpdated,
    onPollCreated,
    onPollUpdated,
    onPollClosed,
    emitRef,
}: UseLivestreamRealtimeOptions) => {
    const queryClient = useQueryClient();
    const onViewerCountUpdatedRef = useRef(onViewerCountUpdated);
    const onPollCreatedRef = useRef(onPollCreated);
    const onPollUpdatedRef = useRef(onPollUpdated);
    const onPollClosedRef = useRef(onPollClosed);

    useEffect(() => { onViewerCountUpdatedRef.current = onViewerCountUpdated; }, [onViewerCountUpdated]);
    useEffect(() => { onPollCreatedRef.current = onPollCreated; }, [onPollCreated]);
    useEffect(() => { onPollUpdatedRef.current = onPollUpdated; }, [onPollUpdated]);
    useEffect(() => { onPollClosedRef.current = onPollClosed; }, [onPollClosed]);

    useEffect(() => {
        if (!enabled || !livestreamId) {
            return;
        }

        const accessToken = authStorage.getAccessToken();
        if (!accessToken) {
            return;
        }

        const socket = connectLivestreamSocket(accessToken);

        const joinRoom = () => {
            socket.emit("joinLivestream", { livestreamId });
        };

        socket.on("connect", joinRoom);
        joinRoom();

        const handleViewerCountUpdated = (payload: { livestreamId: number; viewerCount: number }) => {
            if (payload.livestreamId !== livestreamId) return;

            onViewerCountUpdatedRef.current?.(payload.viewerCount);
            applyViewerCountToCaches(queryClient, livestreamId, payload.viewerCount);
        };

        const handleNewComment = (incoming: LivestreamComment) => {
            if (incoming.livestreamId !== livestreamId) return;

            queryClient.setQueriesData<PaginatedApiResponse<LivestreamComment>>(
                { queryKey: livestreamCommentsPrefixQueryKey(livestreamId) },
                (old) => {
                    if (!old) return old;

                    const { data: nextData, exists } = upsertComment(old.data, incoming);

                    const nextMeta =
                        old.meta?.pagination && typeof old.meta.pagination.total === "number" && !exists
                            ? {
                                  ...old.meta,
                                  pagination: {
                                      ...old.meta.pagination,
                                      total: old.meta.pagination.total + 1,
                                  },
                              }
                            : old.meta;

                    return {
                        ...old,
                        data: nextData,
                        meta: nextMeta,
                    };
                },
            );
        };

        const handlePinnedProductsUpdated = (payload: { livestreamId: number }) => {
            if (payload.livestreamId !== livestreamId) return;
            queryClient.invalidateQueries({ queryKey: livestreamByIdQueryKey(livestreamId) });
        };

        // Poll listeners
        const handlePollCreated = (data: { poll: LivestreamPoll }) => {
            onPollCreatedRef.current?.(data.poll);
        };
        const handlePollUpdated = (result: PollVoteResult) => {
            onPollUpdatedRef.current?.(result);
        };
        const handlePollClosed = (payload: PollClosedPayload) => {
            onPollClosedRef.current?.(payload);
        };

        // Expose emit function so parent can send submitVote
        if (emitRef) {
            emitRef.current = (event: string, data: unknown) => socket.emit(event, data);
        }

        socket.on("viewerCountUpdated", handleViewerCountUpdated);
        socket.on("newLivestreamComment", handleNewComment);
        socket.on("pinnedProductsUpdated", handlePinnedProductsUpdated);
        socket.on("pollCreated", handlePollCreated);
        socket.on("pollUpdated", handlePollUpdated);
        socket.on("pollClosed", handlePollClosed);

        return () => {
            const detailCache = queryClient.getQueryData<ApiResponse<LivestreamDetail>>(
                livestreamByIdQueryKey(livestreamId),
            );
            const fallbackNextCount = Math.max((detailCache?.data.viewerCount ?? 0) - 1, 0);
            applyViewerCountToCaches(queryClient, livestreamId, fallbackNextCount);

            if (emitRef) emitRef.current = null;
            socket.emit("leaveLivestream", { livestreamId });
            socket.off("connect", joinRoom);
            socket.off("viewerCountUpdated", handleViewerCountUpdated);
            socket.off("newLivestreamComment", handleNewComment);
            socket.off("pinnedProductsUpdated", handlePinnedProductsUpdated);
            socket.off("pollCreated", handlePollCreated);
            socket.off("pollUpdated", handlePollUpdated);
            socket.off("pollClosed", handlePollClosed);
            socket.disconnect();
        };
    }, [enabled, livestreamId, queryClient]);
};

export const useLivestreamSummary = (id: number | null) => {
    return useQuery({
        queryKey: id !== null ? livestreamSummaryQueryKey(id) : [],
        queryFn: () => getLivestreamSummary(id!),
        enabled: id !== null,
    });
};

// ── Live Poll Hooks ────────────────────────────────────────

export const useCreatePoll = () => {
    return useMutation({
        mutationFn: ({ livestreamId, question, options }: { livestreamId: number; question: string; options: string[] }) =>
            createPoll(livestreamId, { question, options }),
    });
};

export const useClosePoll = () => {
    return useMutation({
        mutationFn: ({ livestreamId, pollId }: { livestreamId: number; pollId: number }) =>
            closePoll(livestreamId, pollId),
    });
};

export const useGetActivePoll = (livestreamId: number | null) => {
    return useQuery({
        queryKey: [...LIVESTREAMS_QUERY_KEY, livestreamId, "active-poll"] as const,
        queryFn: () => getActivePoll(livestreamId!),
        enabled: livestreamId !== null,
        refetchOnWindowFocus: false,
    });
};
