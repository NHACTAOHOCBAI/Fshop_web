import { ArrowLeft, Heart, Loader2, MessageCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import PostCard from "@/components/posts/PostCard";
import CommentItem from "@/components/posts/CommentItem";
import CommentForm from "@/components/posts/CommentForm";
import { usePostById, usePostComments, useAddPostComment, useTogglePostLike } from "@/hooks/usePosts";
import { formatDate } from "@/lib/utils";
import { extractApiErrorMessage } from "@/lib/api-error";
const PostDetailPage = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const [commentPage, setCommentPage] = useState(1);

    const id = Number(postId);
    const postQuery = usePostById(id, !!id);
    const commentsQuery = usePostComments(id, { page: commentPage, limit: 10 });
    const { mutate: addComment, isPending: isAddingComment } = useAddPostComment();
    const { mutate: toggleLike } = useTogglePostLike();

    const post = postQuery.data;
    const comments = commentsQuery.data?.data ?? [];
    const totalComments = commentsQuery.data?.pagination?.total ?? 0;
    const totalCommentPages = Math.ceil(totalComments / 10);

    const handleLike = useCallback(() => {
        if (!id) return;
        toggleLike(id, {
            onError: (error) => {
                toast.error(extractApiErrorMessage(error));
            },
        });
    }, [id, toggleLike]);

    const handleAddComment = useCallback(
        (content: string) => {
            if (!id) return;

            addComment(
                { postId: id, payload: { content } },
                {
                    onSuccess: () => {
                        toast.success("Bình luận đã được thêm");
                        setCommentPage(1);
                    },
                    onError: (error) => {
                        toast.error(extractApiErrorMessage(error));
                    },
                }
            );
        },
        [id, addComment]
    );

    if (postQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (postQuery.isError || !post) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-slate-600 mb-4">Không thể tải bài viết này</p>
                        <Button onClick={() => postQuery.refetch()}>Thử lại</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>

                {/* Post Detail */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                    <PostCard post={post} />

                    {/* Post Info */}
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={handleLike}
                                className="flex items-center gap-2 hover:text-red-600 transition-colors"
                            >
                                <Heart className="h-5 w-5" />
                                <span>{post.totalLikes} thích</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5" />
                                <span>{totalComments} bình luận</span>
                            </div>
                        </div>
                        <time className="text-xs text-slate-500">{formatDate(post.createdAt)}</time>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        Bình luận ({totalComments})
                    </h3>

                    {/* Comment Form */}
                    <div className="mb-6">
                        <CommentForm onSubmit={handleAddComment} isPending={isAddingComment} />
                    </div>

                    {/* Comments List */}
                    {commentsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-600">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalCommentPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-slate-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCommentPage((p) => Math.max(1, p - 1))}
                                disabled={commentPage === 1 || commentsQuery.isLoading}
                            >
                                Trước
                            </Button>
                            <span className="text-sm text-slate-600">
                                Trang {commentPage} / {totalCommentPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCommentPage((p) => (p < totalCommentPages ? p + 1 : p))}
                                disabled={commentPage >= totalCommentPages || commentsQuery.isLoading}
                            >
                                Sau
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetailPage;
