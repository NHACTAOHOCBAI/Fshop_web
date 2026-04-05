import { Heart, MessageCircle, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTogglePostLike, useDeletePost, useUpdatePost } from "@/hooks/usePosts";
import { formatRelativeTime } from "@/lib/utils";
import { extractApiErrorMessage } from "@/lib/api-error";
import { authStorage } from "@/lib/auth";
import type { Post } from "@/types/post";
import type { User } from "@/types/user";

interface PostCardProps {
    post: Post;
    onPostDeleted?: () => void;
    compact?: boolean;
}

const toSafeLikeCount = (value: unknown, fallback = 0) => {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const PostCard = ({ post, onPostDeleted, compact = false }: PostCardProps) => {
    const currentUserId = authStorage.getUser<User>()?.id;
    const isOwner = currentUserId === post.userId;

    const { mutate: toggleLike, isPending: isLikingPost } = useTogglePostLike();
    const { mutate: deletePost, isPending: isDeletingPost } = useDeletePost();
    const { mutate: updatePost, isPending: isUpdatingPost } = useUpdatePost();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [isUserLiked, setIsUserLiked] = useState(Boolean(post.isLiked));
    const [likeCount, setLikeCount] = useState(() => toSafeLikeCount(post.totalLikes, 0));
    const [editContent, setEditContent] = useState(post.content ?? "");
    const [editHashtags, setEditHashtags] = useState<string[]>(
        post.postHashtags.map((item) => item.hashtag.name)
    );
    const [hashtagInput, setHashtagInput] = useState("");

    useEffect(() => {
        setIsUserLiked(Boolean(post.isLiked));
        setLikeCount(toSafeLikeCount(post.totalLikes, 0));
        setEditContent(post.content ?? "");
        setEditHashtags(post.postHashtags.map((item) => item.hashtag.name));
        setHashtagInput("");
    }, [post.id, post.isLiked, post.totalLikes]);

    const displayImages = useMemo(() => post.images.slice(0, 4), [post.images]);
    const remainingImages = Math.max(0, post.images.length - 4);

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        toggleLike(post.id, {
            onSuccess: (result) => {
                setLikeCount((prev) => {
                    const next = toSafeLikeCount(result?.totalLikes, prev);
                    return next;
                });

                if (typeof result.isLiked === "boolean") {
                    setIsUserLiked(result.isLiked);
                    return;
                }

                if (result.message === "Post liked") {
                    setIsUserLiked(true);
                    return;
                }

                if (result.message === "Post unliked") {
                    setIsUserLiked(false);
                    return;
                }

                setIsUserLiked((prev) => !prev);
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

    const handleOpenEditDialog = (e: React.MouseEvent) => {
        e.preventDefault();
        setEditContent(post.content ?? "");
        setEditHashtags(post.postHashtags.map((item) => item.hashtag.name));
        setHashtagInput("");
        setShowEditDialog(true);
    };

    const handleAddHashtag = () => {
        const normalizedTag = hashtagInput.trim().replace(/^#/, "").toLowerCase();

        if (!normalizedTag) {
            return;
        }

        if (normalizedTag.length > 50) {
            toast.error("Hashtag không được vượt quá 50 ký tự");
            return;
        }

        if (editHashtags.includes(normalizedTag)) {
            toast.error("Hashtag này đã có");
            return;
        }

        if (editHashtags.length >= 10) {
            toast.error("Tối đa 10 hashtags cho một bài viết");
            return;
        }

        setEditHashtags((prev) => [...prev, normalizedTag]);
        setHashtagInput("");
    };

    const handleRemoveHashtag = (index: number) => {
        setEditHashtags((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    };

    const handleEditSubmit = () => {
        updatePost(
            {
                id: post.id,
                payload: {
                    content: editContent.trim() || undefined,
                    hashtags: editHashtags,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật bài viết");
                    setShowEditDialog(false);
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error));
                },
            },
        );
    };

    return (
        <>
            <Link to={`/community/${post.id}`} className={` block ${compact ? "max-w-none" : "max-w-2xl"}`}>
                <div className="overflow-hidden rounded-3xl border border-[#EAF0FF] bg-white  transition-shadow hover:shadow-sm">
                    {/* Author Header */}
                    <div className={`flex items-center justify-between border-b border-[#F1F5F9] ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-app-primary p-0.5">
                                <img
                                    src={post.user.avatar || "https://via.placeholder.com/80"}
                                    alt={post.user.fullName}
                                    className={`${compact ? "h-7 w-7" : "h-8 w-8"} rounded-full border-2 border-white object-cover`}
                                />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#223263]">
                                    {post.user.fullName}
                                </p>
                                <p className="text-xs text-[#9098B1]">{formatRelativeTime(post.createdAt)}</p>
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
                                        onClick={handleOpenEditDialog}
                                        className="cursor-pointer"
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Sửa bài viết
                                    </DropdownMenuItem>
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
                    <div className={compact ? "px-2.5 py-2" : "px-3 py-2.5"}>
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
                            <p className="text-sm font-bold text-[#223263]">{toSafeLikeCount(likeCount, 0).toLocaleString()} lượt thích</p>
                            {post.content ? (
                                <p className={`line-clamp-2 text-sm text-[#223263] ${compact ? "leading-5" : "leading-5"}`}>
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

                            {!compact ? (
                                <p className="pt-0.5 text-sm text-[#9098B1]">Xem tất cả {post.totalComments.toLocaleString()} bình luận</p>
                            ) : null}
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

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Sửa bài viết</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor={`edit-content-${post.id}`}>Nội dung</Label>
                            <Textarea
                                id={`edit-content-${post.id}`}
                                value={editContent}
                                onChange={(event) => setEditContent(event.target.value)}
                                className="mt-2 min-h-28"
                                maxLength={5000}
                                placeholder="Cập nhật nội dung bài viết..."
                            />
                            <p className="mt-1 text-right text-xs text-slate-500">{editContent.length} / 5000</p>
                        </div>

                        <div>
                            <Label htmlFor={`edit-hashtag-${post.id}`}>Hashtags</Label>
                            <div className="mt-2 flex gap-2">
                                <Input
                                    id={`edit-hashtag-${post.id}`}
                                    value={hashtagInput}
                                    onChange={(event) => setHashtagInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            handleAddHashtag();
                                        }
                                    }}
                                    placeholder="Thêm hashtag..."
                                />
                                <Button type="button" variant="outline" onClick={handleAddHashtag}>
                                    Thêm
                                </Button>
                            </div>

                            {editHashtags.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {editHashtags.map((tag, index) => (
                                        <span
                                            key={`${tag}-${index}`}
                                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveHashtag(index)}
                                                className="text-slate-500 hover:text-slate-700"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUpdatingPost}>
                                Hủy
                            </Button>
                            <Button type="button" onClick={handleEditSubmit} disabled={isUpdatingPost}>
                                {isUpdatingPost ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PostCard;