import { Heart, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTogglePostLike, useDeletePost } from "@/hooks/usePosts";
import { formatDate } from "@/lib/utils";
import { extractApiErrorMessage } from "@/lib/api-error";
import { authStorage } from "@/lib/auth";
import type { Post } from "@/types/post";
import type { User } from "@/types/user";

interface PostCardProps {
    post: Post;
    onPostDeleted?: () => void;
}

const PostCard = ({ post, onPostDeleted }: PostCardProps) => {
    const currentUserId = authStorage.getUser<User>()?.id;
    const isOwner = currentUserId === post.userId;

    const { mutate: toggleLike, isPending: isLikingPost } = useTogglePostLike();
    const { mutate: deletePost, isPending: isDeletingPost } = useDeletePost();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isUserLiked, setIsUserLiked] = useState(false);

    const displayImages = useMemo(() => post.images.slice(0, 4), [post.images]);
    const remainingImages = Math.max(0, post.images.length - 4);

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        toggleLike(post.id, {
            onSuccess: () => {
                setIsUserLiked(!isUserLiked);
            },
            onError: (error) => {
                toast.error(extractApiErrorMessage(error));
            },
        });
    };

    const handleDelete = () => {
        deletePost(post.id, {
            onSuccess: () => {
                toast.success("Bài viết đã được xóa");
                setShowDeleteDialog(false);
                onPostDeleted?.();
            },
            onError: (error) => {
                toast.error(extractApiErrorMessage(error));
            },
        });
    };

    return (
        <>
            <Link to={`/community/${post.id}`} className="mx-auto block max-w-2xl">
                <div className="overflow-hidden rounded-3xl border border-[#EAF0FF] bg-white  transition-shadow hover:shadow-sm">
                    {/* Author Header */}
                    <div className="flex items-center justify-between border-b border-[#F1F5F9] px-3 py-2.5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-app-primary p-0.1">
                                <img
                                    src={post.user.avatar || "https://via.placeholder.com/80"}
                                    alt={post.user.fullName}
                                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#223263]">
                                    {post.user.fullName}
                                </p>
                                <p className="text-xs text-[#9098B1]">{formatDate(post.createdAt)}</p>
                            </div>
                        </div>

                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#9098B1]">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowDeleteDialog(true);
                                        }}
                                        className="text-destructive cursor-pointer"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Xóa bài viết
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Images Grid */}
                    {displayImages.length > 0 && (
                        <div>
                            <div
                                className={`grid gap-px bg-[#F1F5F9] ${
                                    displayImages.length === 1
                                        ? "grid-cols-1"
                                        : displayImages.length === 2
                                          ? "grid-cols-2"
                                          : "grid-cols-2"
                                }`}
                                onClick={(e) => e.preventDefault()}
                            >
                                {displayImages.map((image, idx) => (
                                    <div
                                        key={image.id}
                                        className={`group relative overflow-hidden bg-slate-200 ${displayImages.length === 1 ? "aspect-5/4" : "aspect-6/5"}`}
                                    >
                                        <img
                                            src={image.imageUrl}
                                            alt="post"
                                            className="h-full w-full object-cover transition-transform"
                                        />
                                        {remainingImages > 0 && idx === 3 && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                <span className="text-sm font-semibold text-white">
                                                    +{remainingImages}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="px-3 py-2.5">
                        <div className="mb-1.5 flex items-center justify-between" onClick={(e) => e.preventDefault()}>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleLike}
                                    disabled={isLikingPost}
                                    className="text-[#223263] transition-colors hover:text-red-500 disabled:opacity-50"
                                >
                                    <Heart
                                        className={`h-5 w-5 ${
                                            isUserLiked ? "fill-app-secondary text-app-secondary" : ""
                                        }`}
                                    />
                                </button>
                                <button
                                    type="button"
                                    className="text-[#223263] transition-colors hover:text-primary"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-bold text-[#223263]">{post.totalLikes.toLocaleString()} lượt thích</p>
                            {post.content ? (
                                <p className="line-clamp-2 text-sm leading-5 text-[#223263]">
                                    <span className="mr-1 font-bold">{post.user.fullName}</span>
                                    {post.content}
                                </p>
                            ) : null}

                            {post.postHashtags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {post.postHashtags.map((ph) => (
                                        <span
                                            key={ph.id}
                                            className="text-xs font-semibold text-app-primary"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            #{ph.hashtag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <p className="pt-0.5 text-sm text-[#9098B1]">Xem tất cả {post.totalComments.toLocaleString()} bình luận</p>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa bài viết</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-3 justify-end">
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeletingPost}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeletingPost ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default PostCard;