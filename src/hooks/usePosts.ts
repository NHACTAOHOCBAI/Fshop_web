import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as postsService from "@/services/posts";
import type { GetPostsParams } from "@/types/post";

export const POSTS_QUERY_KEY = ["posts"];

/**
 * Get paginated list of posts
 */
export const usePosts = (params?: GetPostsParams) => {
    return useQuery({
        queryKey: [...POSTS_QUERY_KEY, params],
        queryFn: () => postsService.getPosts(params),
    });
};

/**
 * Get single post by ID
 */
export const usePostById = (id: number | null, enabled = true) => {
    return useQuery({
        queryKey: [...POSTS_QUERY_KEY, id],
        queryFn: () => postsService.getPostById(id!),
        enabled: enabled && !!id,
    });
};

/**
 * Create a new post
 */
export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postsService.createPost,
        onSuccess: () => {
            // Invalidate and refetch posts list
            queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
        },
    });
};

/**
 * Update a post
 */
export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof postsService.updatePost>[1] }) =>
            postsService.updatePost(id, payload),
        onSuccess: (data) => {
            // Invalidate specific post and list
            queryClient.invalidateQueries({ queryKey: [...POSTS_QUERY_KEY, data.id] });
            queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
        },
    });
};

/**
 * Delete a post
 */
export const useDeletePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postsService.deletePost,
        onSuccess: () => {
            // Invalidate posts list
            queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
        },
    });
};

/**
 * Toggle like on a post
 */
export const useTogglePostLike = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postsService.togglePostLike,
        onSuccess: () => {
            // Refetch all posts to get updated like counts
            queryClient.invalidateQueries({ queryKey: POSTS_QUERY_KEY });
        },
    });
};

/**
 * Get comments for a post
 */
export const usePostComments = (postId: number, params?: GetPostsParams) => {
    return useQuery({
        queryKey: [...POSTS_QUERY_KEY, postId, "comments", params],
        queryFn: () => postsService.getPostComments(postId, params),
    });
};

/**
 * Add a comment to a post
 */
export const useAddPostComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            postId,
            payload,
        }: {
            postId: number;
            payload: Parameters<typeof postsService.addPostComment>[1];
        }) => postsService.addPostComment(postId, payload),
        onSuccess: (data) => {
            // Invalidate comments for this post
            queryClient.invalidateQueries({
                queryKey: [...POSTS_QUERY_KEY, data.postId, "comments"],
            });
            // Also invalidate the post itself to update comment count
            queryClient.invalidateQueries({ queryKey: [...POSTS_QUERY_KEY, data.postId] });
        },
    });
};

/**
 * Update a comment
 */
export const useUpdatePostComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            postId,
            commentId,
            payload,
        }: {
            postId: number;
            commentId: number;
            payload: Parameters<typeof postsService.updatePostComment>[2];
        }) => postsService.updatePostComment(postId, commentId, payload),
        onSuccess: (data) => {
            // Invalidate comments for this post
            queryClient.invalidateQueries({
                queryKey: [...POSTS_QUERY_KEY, data.postId, "comments"],
            });
        },
    });
};

/**
 * Delete a comment
 */
export const useDeletePostComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            postId,
            commentId,
        }: {
            postId: number;
            commentId: number;
        }) => postsService.deletePostComment(postId, commentId),
        onSuccess: (_, { postId }) => {
            // Invalidate comments for this post
            queryClient.invalidateQueries({
                queryKey: [...POSTS_QUERY_KEY, postId, "comments"],
            });
            // Also invalidate the post itself to update comment count
            queryClient.invalidateQueries({ queryKey: [...POSTS_QUERY_KEY, postId] });
        },
    });
};

/**
 * Get replies for a comment
 */
export const useCommentReplies = (
    postId: number,
    commentId: number,
    params?: GetPostsParams,
    enabled = true,
) => {
    return useQuery({
        queryKey: [...POSTS_QUERY_KEY, postId, "comments", commentId, "replies", params],
        queryFn: () => postsService.getCommentReplies(postId, commentId, params),
        enabled,
    });
};

/**
 * Add a reply to a comment
 */
export const useAddCommentReply = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            postId,
            commentId,
            payload,
        }: {
            postId: number;
            commentId: number;
            payload: Parameters<typeof postsService.addCommentReply>[2];
        }) => postsService.addCommentReply(postId, commentId, payload),
        onSuccess: (data) => {
            // Invalidate replies for this comment
            queryClient.invalidateQueries({
                queryKey: [...POSTS_QUERY_KEY, data.postId, "comments", data.parentCommentId, "replies"],
            });

            // Also refresh comment list and post detail to sync reply count immediately
            queryClient.invalidateQueries({
                queryKey: [...POSTS_QUERY_KEY, data.postId, "comments"],
            });
            queryClient.invalidateQueries({ queryKey: [...POSTS_QUERY_KEY, data.postId] });
        },
    });
};
