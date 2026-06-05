import { ArrowLeft, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import PostCard from "@/components/posts/PostCard";
import CommentItem from "@/components/posts/CommentItem";
import CommentForm from "@/components/posts/CommentForm";
import {
    usePostById,
    usePostComments,
    useAddPostComment,
    useAddCommentReply,
    useDeletePostComment,
    useDeleteAdminPostComment,
    useUpdatePostComment,
    useCommentReplies,
    POSTS_QUERY_KEY,
} from "@/hooks/usePosts";
import { extractApiErrorMessage } from "@/lib/api-error";
import type { PostComment } from "@/types/post";

type CommentRepliesProps = {
    postId: number;
    parentComment: PostComment;
    allComments: PostComment[];
    expandedReplies: Record<number, boolean>;
    onToggleReplies: (commentId: number) => void;
    highlightedCommentId: number | null;
    depth?: number;
    onReply: (commentId: number) => void;
    onEdit: (comment: PostComment) => void;
    onDelete: (commentId: number) => void;
    deletingCommentId: number | null;
    isExpanded: boolean;
    canDelete: boolean;
    editingCommentId: number | null;
    editingContent: string;
    setEditingContent: (val: string) => void;
    onCancelEdit: () => void;
    onSubmitEdit: (commentId: number) => void;
    isUpdatingComment: boolean;
};

type PostDetailPageProps = {
    isModal?: boolean;
    onClose?: () => void;
    postId?: number;
    allowAdminDelete?: boolean;
};

const CommentReplies = ({
    postId,
    parentComment,
    allComments,
    expandedReplies,
    onToggleReplies,
    highlightedCommentId,
    depth = 1,
    onReply,
    onEdit,
    onDelete,
    deletingCommentId,
    isExpanded,
    canDelete,
    editingCommentId,
    editingContent,
    setEditingContent,
    onCancelEdit,
    onSubmitEdit,
    isUpdatingComment,
}: CommentRepliesProps) => {
    const repliesQuery = useCommentReplies(postId, parentComment.id, {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "ASC",
    }, isExpanded);

    if (!isExpanded) {
        return null;
    }

    const fallbackReplies = allComments
        .filter((item) => item.parentCommentId === parentComment.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const apiReplies = repliesQuery.data?.data ?? [];
    const replies = apiReplies.length > 0 ? apiReplies : fallbackReplies;

    if (repliesQuery.isLoading && replies.length === 0) {
        return (
            <div className="ml-6 flex items-center gap-2 py-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải phản hồi...
            </div>
        );
    }

    if (replies.length === 0) {
        return (
            <p className="ml-6 py-2 text-sm text-slate-500">Chưa có phản hồi nào.</p>
        );
    }

    return (
        <div className="mt-2 space-y-1 border-l border-slate-100 pl-3">
            {replies.map((reply) => (
                <div
                    key={reply.id}
                    id={`comment-${reply.id}`}
                    className={`scroll-mt-20 rounded-md transition-colors ${
                        highlightedCommentId === reply.id ? "bg-sky-50" : ""
                    }`}
                >
                    <CommentItem
                        comment={reply}
                        depth={depth}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        canDelete={canDelete}
                        isDeleting={deletingCommentId === reply.id}
                        isEditing={editingCommentId === reply.id}
                        editContent={editingContent}
                        onEditContentChange={setEditingContent}
                        onSaveEdit={() => onSubmitEdit(reply.id)}
                        onCancelEdit={onCancelEdit}
                        isSavingEdit={isUpdatingComment}
                    />

                    {reply.replyCount > 0 ? (
                        <button
                            type="button"
                            onClick={() => onToggleReplies(reply.id)}
                            className="ml-11 mt-1 text-xs font-medium text-sky-600 hover:text-sky-700"
                        >
                            {expandedReplies[reply.id]
                                ? "Ẩn phản hồi"
                                : `Xem ${reply.replyCount} phản hồi`}
                        </button>
                    ) : null}

                    <CommentReplies
                        postId={postId}
                        parentComment={reply}
                        allComments={allComments}
                        expandedReplies={expandedReplies}
                        onToggleReplies={onToggleReplies}
                        highlightedCommentId={highlightedCommentId}
                        depth={depth + 1}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        canDelete={canDelete}
                        deletingCommentId={deletingCommentId}
                        isExpanded={!!expandedReplies[reply.id]}
                        editingCommentId={editingCommentId}
                        editingContent={editingContent}
                        setEditingContent={setEditingContent}
                        onCancelEdit={onCancelEdit}
                        onSubmitEdit={onSubmitEdit}
                        isUpdatingComment={isUpdatingComment}
                    />
                </div>
            ))}
        </div>
    );
};

const PostDetailPage = ({ isModal = true, onClose, postId: postIdOverride, allowAdminDelete = false }: PostDetailPageProps) => {
    const queryClient = useQueryClient();
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const [commentPage, setCommentPage] = useState(1);
    const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [deletingCommentId, setDeletingCommentId] = useState<number | null>(
        null,
    );
    const [commentToDeleteId, setCommentToDeleteId] = useState<number | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<
        Record<number, boolean>
    >({});
    const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);

    const clearReplyTarget = useCallback(() => {
        setReplyingTo(null);
        setHighlightedCommentId(null);
    }, []);

    const id = postIdOverride ?? Number(postId);
    const postQuery = usePostById(id, !!id);
    const commentsQuery = usePostComments(id, {
        page: commentPage,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const { mutate: addComment, isPending: isAddingComment } =
        useAddPostComment();
    const { mutate: addReply, isPending: isAddingReply } = useAddCommentReply();
    const { mutate: updateComment, isPending: isUpdatingComment } =
        useUpdatePostComment();
    const { mutate: deleteComment, isPending: isDeletingComment } =
        useDeletePostComment();
    const { mutate: deleteAdminComment, isPending: isDeletingAdminComment } =
        useDeleteAdminPostComment();
    const post = postQuery.data;
    const comments = commentsQuery.data?.data ?? [];
    const rootComments = comments.filter((comment) => !comment.parentCommentId);
    const totalComments = commentsQuery.data?.pagination?.total ?? 0;
    const totalCommentPages = Math.ceil(totalComments / 10);

    const refreshPostCommentsData = useCallback(async () => {
        if (!id) return;

        // Always force refresh for any newly created comment/reply.
        await queryClient.invalidateQueries({
            queryKey: [...POSTS_QUERY_KEY, id, "comments"],
            refetchType: "all",
        });
        await queryClient.invalidateQueries({ queryKey: [...POSTS_QUERY_KEY, id] });
        await Promise.all([commentsQuery.refetch(), postQuery.refetch()]);
    }, [id, queryClient, commentsQuery, postQuery]);

    const handleAddComment = useCallback(
        (content: string) => {
            if (!id) return;

            if (replyingTo) {
                addReply(
                    { postId: id, commentId: replyingTo.id, payload: { content } },
                    {
                        onSuccess: (createdReply) => {
                            toast.success("Đã gửi phản hồi");
                            const parentThreadId = createdReply.parentCommentId ?? replyingTo.id;

                            setExpandedReplies((prev) => ({
                                ...prev,
                                [parentThreadId]: true,
                            }));
                            clearReplyTarget();
                            void refreshPostCommentsData();
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
                        clearReplyTarget();
                        void refreshPostCommentsData();
                    },
                    onError: (error) => {
                        toast.error(extractApiErrorMessage(error));
                    },
                },
            );
        },
        [id, addComment, addReply, replyingTo, clearReplyTarget, refreshPostCommentsData],
    );

    const handleReply = useCallback(
        (commentId: number) => {
            const allComments = commentsQuery.data?.data ?? [];
            const target = allComments.find((item) => item.id === commentId);
            if (target) {
                setHighlightedCommentId(commentId);
                window.setTimeout(() => {
                    document
                        .getElementById(`comment-${commentId}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 0);

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
        clearReplyTarget();
    }, [clearReplyTarget]);

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
                        void refreshPostCommentsData();
                    },
                    onError: (error) => {
                        toast.error(extractApiErrorMessage(error));
                    },
                },
            );
        },
        [id, editingContent, updateComment, refreshPostCommentsData],
    );

    const handleDeleteComment = useCallback(
        (commentId: number) => {
            setCommentToDeleteId(commentId);
        },
        [],
    );

    const handleConfirmDeleteComment = useCallback(() => {
        if (!id || !commentToDeleteId) return;

        setDeletingCommentId(commentToDeleteId);
        const deletingId = commentToDeleteId;
        const mutate = allowAdminDelete ? deleteAdminComment : deleteComment;

        mutate(
            { postId: id, commentId: deletingId },
            {
                onSuccess: () => {
                    toast.success("Đã xóa bình luận");
                    if (editingCommentId === deletingId) {
                        setEditingCommentId(null);
                        setEditingContent("");
                    }
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error));
                },
                onSettled: () => {
                    setDeletingCommentId(null);
                    setCommentToDeleteId(null);
                },
            },
        );
    }, [id, commentToDeleteId, allowAdminDelete, deleteAdminComment, deleteComment, editingCommentId]);

    const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
        if (!open && !(isDeletingComment || isDeletingAdminComment)) {
            setCommentToDeleteId(null);
        }
    }, [isDeletingComment, isDeletingAdminComment]);

    const toggleReplies = useCallback((commentId: number) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    }, []);

    const handleClose = useCallback(() => {
        if (isModal) {
            onClose?.();
            return;
        }

        navigate(-1);
    }, [isModal, navigate, onClose]);

    if (postQuery.isLoading) {
        return (
            <div className={isModal ? "flex items-center justify-center py-14" : "flex min-h-screen items-center justify-center"}>
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (postQuery.isError || !post) {
        if (isModal) {
            return (
                <div className="py-8 text-center">
                    <p className="mb-4 text-slate-600">Không thể tải bài viết này</p>
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Đóng
                        </Button>
                        <Button onClick={() => postQuery.refetch()}>Thử lại</Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-3xl mx-auto px-4">
                    <Button variant="ghost" onClick={handleClose} className="mb-4">
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
        <div className={isModal ? "h-[82vh]" : ""}>
            {!isModal ? (
                <Button variant="ghost" onClick={handleClose} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                </Button>
            ) : null}

            <div className={isModal ? "grid h-full gap-6 lg:grid-cols-5" : "flex justify-between gap-8"}>
                <div className={isModal ? "min-h-0 overflow-y-auto pr-1 lg:col-span-3" : "flex-5"}>
                    {/* Back Button */}

                    {/* Post Detail */}
                    <div className="bg-white rounded-lg  overflow-hidden mb-6">
                        <PostCard post={post} compact imageMode="carousel" onPostDeleted={handleClose} />
                    </div>

                    {/* Comments Section */}
                </div>
                <div className={isModal ? "flex h-full min-h-0 flex-col rounded-lg border border-slate-100 bg-white lg:col-span-2" : "bg-white rounded-lg flex-3"}>
                    <div className={isModal ? "flex-1 min-h-0 overflow-y-auto p-4" : ""}>
                        {/* Comments List */}
                        {commentsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : rootComments.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-600">
                                    Chưa có bình luận nào. Hãy là người đầu tiên!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rootComments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        id={`comment-${comment.id}`}
                                        className={`scroll-mt-20 border-b border-slate-100 pb-3 transition-colors last:border-b-0 ${
                                            highlightedCommentId === comment.id ? "rounded-md bg-sky-50" : ""
                                        }`}
                                    >
                                        <CommentItem
                                            comment={comment}
                                            onReply={handleReply}
                                            onEdit={handleStartEdit}
                                            onDelete={handleDeleteComment}
                                            canDelete={allowAdminDelete}
                                            isDeleting={
                                                (isDeletingComment || isDeletingAdminComment) && deletingCommentId === comment.id
                                            }
                                            isEditing={editingCommentId === comment.id}
                                            editContent={editingContent}
                                            onEditContentChange={setEditingContent}
                                            onSaveEdit={() => handleSubmitEdit(comment.id)}
                                            onCancelEdit={handleCancelEdit}
                                            isSavingEdit={isUpdatingComment}
                                        />

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
                                            allComments={comments}
                                            expandedReplies={expandedReplies}
                                            onToggleReplies={toggleReplies}
                                            highlightedCommentId={highlightedCommentId}
                                            onReply={handleReply}
                                            onEdit={handleStartEdit}
                                            onDelete={handleDeleteComment}
                                            canDelete={allowAdminDelete}
                                            deletingCommentId={deletingCommentId}
                                            isExpanded={!!expandedReplies[comment.id]}
                                            editingCommentId={editingCommentId}
                                            editingContent={editingContent}
                                            setEditingContent={setEditingContent}
                                            onCancelEdit={handleCancelEdit}
                                            onSubmitEdit={handleSubmitEdit}
                                            isUpdatingComment={isUpdatingComment}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalCommentPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-3 border-t border-slate-100 pt-6">
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

                    <div className={isModal ? "shrink-0 border-t border-slate-100 bg-white p-3" : "mb-6"}>
                        <CommentForm
                            onSubmit={handleAddComment}
                            isPending={isAddingComment || isAddingReply}
                            replyingTo={replyingTo}
                            onCancelReply={clearReplyTarget}
                        />
                    </div>
                </div>
            </div>

            <AlertDialog open={Boolean(commentToDeleteId)} onOpenChange={handleDeleteDialogOpenChange}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa bình luận</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bình luận đã chọn sẽ bị xóa và không thể khôi phục.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingComment || isDeletingAdminComment}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteComment}
                            disabled={isDeletingComment || isDeletingAdminComment}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeletingComment || isDeletingAdminComment ? "Đang xóa..." : "Xóa bình luận"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PostDetailPage;
