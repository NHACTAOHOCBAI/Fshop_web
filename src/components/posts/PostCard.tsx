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
            <Link to={`/community/${post.id}`} className="block">
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Author Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {post.user.avatar && (
                                <img
                                    src={post.user.avatar}
                                    alt={post.user.fullName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            )}
                            <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                    {post.user.fullName}
                                </p>
                                <p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p>
                            </div>
                        </div>

                        {isOwner && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

                    {/* Content */}
                    <div className="px-6 py-4">
                        {post.content && (
                            <p className="text-slate-700 mb-3 line-clamp-3 text-sm leading-relaxed">
                                {post.content}
                            </p>
                        )}

                        {/* Hashtags */}
                        {post.postHashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {post.postHashtags.map((ph) => (
                                    <span
                                        key={ph.id}
                                        className="text-xs text-blue-600 font-medium"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        #{ph.hashtag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Images Grid */}
                    {displayImages.length > 0 && (
                        <div className="px-6 pb-4">
                            <div
                                className={`grid gap-2 ${
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
                                        className="relative bg-slate-200 rounded overflow-hidden aspect-square group"
                                    >
                                        <img
                                            src={image.imageUrl}
                                            alt="post"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        {remainingImages > 0 && idx === 3 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    +{remainingImages}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions Footer */}
                    <div
                        className="px-6 py-3 border-t border-slate-100 flex items-center gap-4 bg-slate-50"
                        onClick={(e) => e.preventDefault()}
                    >
                        <button
                            onClick={handleLike}
                            disabled={isLikingPost}
                            className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <Heart
                                className={`h-4 w-4 ${
                                    isUserLiked ? "fill-red-600 text-red-600" : ""
                                }`}
                            />
                            <span>{post.totalLikes}</span>
                        </button>
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.totalComments}</span>
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