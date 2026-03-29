import axiosInstance from "@/lib/axios";
import type {
    Post,
    PostComment,
    CreatePostPayload,
    UpdatePostPayload,
    CreateCommentPayload,
    UpdateCommentPayload,
    GetPostsParams,
    PostsResponse,
} from "@/types/post";

const API_BASE = "/posts";

/**
 * Get paginated list of posts
 */
export const getPosts = async (params: GetPostsParams = {}) => {
    const response = await axiosInstance.get<PostsResponse<Post>>(`${API_BASE}`, {
        params,
    });
    return response.data;
};

/**
 * Get single post by ID
 */
export const getPostById = async (id: number) => {
    const response = await axiosInstance.get(`${API_BASE}/${id}`) as { data: { data: Post } };
    return response.data.data;
};

/**
 * Create a new post
 */
export const createPost = async (payload: CreatePostPayload) => {
    const formData = new FormData();

    if (payload.content) {
        formData.append("content", payload.content);
    }

    if (payload.hashtags && payload.hashtags.length > 0) {
        formData.append("hashtags", JSON.stringify(payload.hashtags));
    }

    if (payload.postImages && payload.postImages.length > 0) {
        payload.postImages.forEach((file) => {
            formData.append("postImages", file);
        });
    }

    const response = await axiosInstance.post<Post>(`${API_BASE}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Update a post
 */
export const updatePost = async (id: number, payload: UpdatePostPayload) => {
    const formData = new FormData();

    if (payload.content !== undefined) {
        formData.append("content", payload.content);
    }

    if (payload.hashtags) {
        formData.append("hashtags", JSON.stringify(payload.hashtags));
    }

    if (payload.postImages && payload.postImages.length > 0) {
        payload.postImages.forEach((file) => {
            formData.append("postImages", file);
        });
    }

    const response = await axiosInstance.patch<Post>(`${API_BASE}/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
};

/**
 * Delete a post
 */
export const deletePost = async (id: number) => {
    const response = await axiosInstance.delete<{ message: string }>(`${API_BASE}/${id}`);
    return response.data;
};

/**
 * Toggle like on a post
 */
export const togglePostLike = async (postId: number) => {
    const response = await axiosInstance.post<{ isLiked: boolean; totalLikes: number }>(
        `${API_BASE}/${postId}/like`
    );
    return response.data;
};

/**
 * Get comments for a post
 */
export const getPostComments = async (postId: number, params: GetPostsParams = {}) => {
    const response = await axiosInstance.get<PostsResponse<PostComment>>(
        `${API_BASE}/${postId}/comments`,
        {
            params,
        }
    );
    return response.data;
};

/**
 * Add a comment to a post
 */
export const addPostComment = async (postId: number, payload: CreateCommentPayload) => {
    const response = await axiosInstance.post<PostComment>(
        `${API_BASE}/${postId}/comment`,
        payload
    );
    return response.data;
};

/**
 * Update a comment
 */
export const updatePostComment = async (postId: number, commentId: number, payload: UpdateCommentPayload) => {
    const response = await axiosInstance.put<PostComment>(
        `${API_BASE}/${postId}/comments/${commentId}`,
        payload
    );
    return response.data;
};

/**
 * Delete a comment
 */
export const deletePostComment = async (postId: number, commentId: number) => {
    const response = await axiosInstance.delete<{ message: string }>(
        `${API_BASE}/${postId}/comments/${commentId}`
    );
    return response.data;
};

/**
 * Add a reply to a comment
 */
export const addCommentReply = async (
    postId: number,
    commentId: number,
    payload: CreateCommentPayload
) => {
    const response = await axiosInstance.post<PostComment>(
        `${API_BASE}/${postId}/comments/${commentId}/replies`,
        payload
    );
    return response.data;
};

/**
 * Get replies for a comment
 */
export const getCommentReplies = async (
    postId: number,
    commentId: number,
    params: GetPostsParams = {}
) => {
    const response = await axiosInstance.get<PostsResponse<PostComment>>(
        `${API_BASE}/${postId}/comments/${commentId}/replies`,
        {
            params,
        }
    );
    return response.data;
};
