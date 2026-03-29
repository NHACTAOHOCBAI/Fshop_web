import { ArrowLeft, Heart, Loader2, MessageCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import PostCard from "@/components/posts/PostCard";
import CommentItem from "@/components/posts/CommentItem";
import CommentForm from "@/components/posts/CommentForm";
import {
    usePostById,
    usePostComments,
    useAddPostComment,
    useTogglePostLike,
    useAddCommentReply,
    useDeletePostComment,
    useUpdatePostComment,
    useCommentReplies,
} from "@/hooks/usePosts";
import { formatDate } from "@/lib/utils";
import { extractApiErrorMessage } from "@/lib/api-error";
import type { PostComment } from "@/types/post";

type CommentRepliesProps = {
    postId: number;
    parentComment: PostComment;
    onReply: (commentId: number) => void;
    onEdit: (comment: PostComment) => void;
    onDelete: (commentId: number) => void;
    deletingCommentId: number | null;
    isExpanded: boolean;
};

const CommentReplies = ({
    postId,
    parentComment,
    onReply,
    onEdit,
    onDelete,
    deletingCommentId,
    isExpanded,
}: CommentRepliesProps) => {
    const repliesQuery = useCommentReplies(postId, parentComment.id, {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "ASC",
    });

    if (!isExpanded) {
        return null;
    }

    if (repliesQuery.isLoading) {
        return (
            <div className="ml-6 flex items-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải phản hồi...
            </div>
        );
    }

    const replies = repliesQuery.data?.data ?? [];
    if (replies.length === 0) {
        return (
            <p className="ml-6 py-2 text-sm text-slate-500">Chưa có phản hồi nào.</p>
        );
    }

    return (
        <div className="mt-2 space-y-1 border-l border-slate-100 pl-3">
            {replies.map((reply) => (
                <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={1}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={deletingCommentId === reply.id}
                />
            ))}
        </div>
    );
};

const PostDetailPage = () => {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const [commentPage, setCommentPage] = useState(1);
    const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
        null,
    );
    const [expandedReplies, setExpandedReplies] = useState<
        Record<number, boolean>
    >({});

    const id = Number(postId);
    const postQuery = usePostById(id, !!id);
    const commentsQuery = usePostComments(id, { page: commentPage, limit: 10 });
    const { mutate: addComment, isPending: isAddingComment } =
        useAddPostComment();
    const { mutate: addReply, isPending: isAddingReply } = useAddCommentReply();
    const { mutate: updateComment, isPending: isUpdatingComment } =
        useUpdatePostComment();
    const { mutate: deleteComment, isPending: isDeletingComment } =
        useDeletePostComment();
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

            if (replyingTo) {
                addReply(
                    { postId: id, commentId: replyingTo.id, payload: { content } },
                    {
                        onSuccess: () => {
                            toast.success("Đã gửi phản hồi");
                            setExpandedReplies((prev) => ({
                                ...prev,
                                [replyingTo.id]: true,
                            }));
                            setReplyingTo(null);
                        },
                        onError: (error) => {
                            toast.error(extractApiErrorMessage(error));
                        },
                    },
                );
                return;
            }

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
                },
            );
        },
        [id, addComment, addReply, replyingTo],
    );

    const handleReply = useCallback(
        (commentId: number) => {
            const allComments = commentsQuery.data?.data ?? [];
            const target = allComments.find((item) => item.id === commentId);
            if (target) {
                setReplyingTo(target);
                return;
            }

            setReplyingTo({
                id: commentId,
                postId: id,
                userId: 0,
                user: { id: 0, fullName: "Người dùng", email: "" },
                content: "",
                depth: 0,
                replyCount: 0,
                parentCommentId: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        },
        [commentsQuery.data?.data, id],
    );

    const handleStartEdit = useCallback((comment: PostComment) => {
        setEditingCommentId(comment.id);
        setEditingContent(comment.content);
        setReplyingTo(null);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingCommentId(null);
        setEditingContent("");
    }, []);

    const handleSubmitEdit = useCallback(
        (commentId: number) => {
            if (!id || !editingContent.trim()) return;

            updateComment(
                { postId: id, commentId, payload: { content: editingContent.trim() } },
                {
                    onSuccess: () => {
                        toast.success("Đã cập nhật bình luận");
                        setEditingCommentId(null);
                        setEditingContent("");
                    },
                    onError: (error) => {
                        toast.error(extractApiErrorMessage(error));
                    },
                },
            );
        },
        [id, editingContent, updateComment],
    );

    const handleDeleteComment = useCallback(
        (commentId: number) => {
            if (!id) return;
            if (!window.confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

            setDeletingCommentId(commentId);
            deleteComment(
                { postId: id, commentId },
                {
                    onSuccess: () => {
                        toast.success("Đã xóa bình luận");
                        if (editingCommentId === commentId) {
                            setEditingCommentId(null);
                            setEditingContent("");
                        }
                    },
                    onError: (error) => {
                        toast.error(extractApiErrorMessage(error));
                    },
                    onSettled: () => {
                        setDeletingCommentId(null);
                    },
                },
            );
        },
        [id, deleteComment, editingCommentId],
    );

    const toggleReplies = useCallback((commentId: number) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    }, []);

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
        <>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
            </Button>
            <div className="flex justify-between gap-8">
                <div className="flex-5">
                    {/* Back Button */}

                    {/* Post Detail */}
                    <div className="bg-white rounded-lg  overflow-hidden mb-6">
                        <PostCard post={post} />
                    </div>

                    {/* Comments Section */}
                </div>
                <div className="bg-white rounded-lg flex-3 ">
                    {/* Comment Form */}
                    <div className="mb-6">
                        <CommentForm
                            onSubmit={handleAddComment}
                            isPending={isAddingComment || isAddingReply}
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                        />
                    </div>

                    {/* Comments List */}
                    {commentsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-600">
                                Chưa có bình luận nào. Hãy là người đầu tiên!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="border-b border-slate-100 pb-3 last:border-b-0"
                                >
                                    {editingCommentId === comment.id ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                            <Textarea
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                                className="min-h-[90px] resize-none"
                                            />
                                            <div className="mt-3 flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCancelEdit}
                                                >
                                                    Hủy
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleSubmitEdit(comment.id)}
                                                    disabled={isUpdatingComment || !editingContent.trim()}
                                                >
                                                    {isUpdatingComment ? "Đang lưu..." : "Lưu"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <CommentItem
                                            comment={comment}
                                            onReply={handleReply}
                                            onEdit={handleStartEdit}
                                            onDelete={handleDeleteComment}
                                            isDeleting={
                                                isDeletingComment && deletingCommentId === comment.id
                                            }
                                        />
                                    )}

                                    {comment.replyCount > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => toggleReplies(comment.id)}
                                            className="ml-11 mt-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                                        >
                                            {expandedReplies[comment.id]
                                                ? "Ẩn phản hồi"
                                                : `Xem ${comment.replyCount} phản hồi`}
                                        </button>
                                    ) : null}

                                    <CommentReplies
                                        postId={id}
                                        parentComment={comment}
                                        onReply={handleReply}
                                        onEdit={handleStartEdit}
                                        onDelete={handleDeleteComment}
                                        deletingCommentId={deletingCommentId}
                                        isExpanded={!!expandedReplies[comment.id]}
                                    />
                                </div>
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
                                onClick={() =>
                                    setCommentPage((p) => (p < totalCommentPages ? p + 1 : p))
                                }
                                disabled={
                                    commentPage >= totalCommentPages || commentsQuery.isLoading
                                }
                            >
                                Sau
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PostDetailPage;
