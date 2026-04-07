import { Reply, Trash2, Edit2, MoreVertical } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime, toAlias } from "@/lib/utils";
import { authStorage } from "@/lib/auth";
import type { PostComment } from "@/types/post";
import type { User } from "@/types/user";

interface CommentItemProps {
    comment: PostComment;
    onReply?: (commentId: number) => void;
    onEdit?: (comment: PostComment) => void;
    onDelete?: (commentId: number) => void;
    isDeleting?: boolean;
    depth?: number;
    canDelete?: boolean;
}

const CommentItem = ({
    comment,
    onReply,
    onEdit,
    onDelete,
    isDeleting,
    depth = 0,
    canDelete,
}: CommentItemProps) => {
    const currentUserId = authStorage.getUser<User>()?.id;
    const isOwner = currentUserId === comment.userId;
    const canDeleteComment = canDelete ?? isOwner;
    const [showActions, setShowActions] = useState(false);

    return (
        <div className={`flex gap-3 ${depth > 0 ? "ml-6" : ""} py-3`}>
            {/* Avatar */}
            {comment.user.avatar ? (
                <img
                    src={comment.user.avatar}
                    alt={comment.user.fullName}
                    className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover"
                />
            ) : (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700">
                    {toAlias(comment.user.fullName || "U")}
                </div>
            )}

            {/* Comment Content */}
            <div className="grow min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 text-sm">
                            {comment.user.fullName}
                        </p>
                        <p className="text-xs text-slate-500">{formatRelativeTime(comment.createdAt)}</p>
                    </div>

                    {(isOwner || canDeleteComment) && (
                        <DropdownMenu open={showActions} onOpenChange={setShowActions}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isOwner ? (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            onEdit?.(comment);
                                            setShowActions(false);
                                        }}
                                    >
                                        <Edit2 className="mr-2 h-4 w-4" />
                                        Sửa
                                    </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                    onClick={() => {
                                        onDelete?.(comment.id);
                                        setShowActions(false);
                                    }}
                                    className="text-destructive"
                                    disabled={isDeleting || !canDeleteComment}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Comment Text */}
                <p className="mb-2 text-sm text-slate-700 wrap-break-word">{comment.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-3 -ml-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => onReply?.(comment.id)}
                    >
                        <Reply className="mr-1 h-3 w-3" />
                        Trả lời
                    </Button>
                    {comment.replyCount > 0 && (
                        <span className="text-xs text-slate-500">{comment.replyCount} câu trả lời</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentItem;