export type PostUser = {
    id: number;
    fullName: string;
    email: string;
    avatar?: string;
};

export type PostImage = {
    id: number;
    postId: number;
    imageUrl: string;
    publicId: string;
    createdAt: string;
    updatedAt: string;
};

export type Hashtag = {
    id: number;
    name: string;
    postCount: number;
};

export type PostHashtag = {
    id: number;
    postId: number;
    hashtagId: number;
    hashtag: Hashtag;
};

export type Post = {
    id: number;
    userId: number;
    user: PostUser;
    content?: string;
    isLiked?: boolean;
    totalLikes: number;
    totalComments: number;
    images: PostImage[];
    postHashtags: PostHashtag[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type PostComment = {
    id: number;
    userId: number;
    postId: number;
    user: PostUser;
    content: string;
    depth: number;
    replyCount: number;
    parentCommentId: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type GetPostsParams = {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
};

export type CreatePostPayload = {
    content?: string;
    hashtags?: string[];
    postImages?: File[];
};

export type UpdatePostPayload = {
    content?: string;
    hashtags?: string[];
    postImages?: File[];
};

export type CreateCommentPayload = {
    content: string;
};

export type UpdateCommentPayload = {
    content: string;
};

export type PostsResponse<T> = {
    pagination: {
        total: number;
        page?: number;
        limit?: number;
    };
    data: T[];
};
