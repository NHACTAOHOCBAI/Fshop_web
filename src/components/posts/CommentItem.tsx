import { Reply, Trash2, Edit2, MoreVertical } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
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
}

const CommentItem = ({
    comment,
    onReply,
    onEdit,
    onDelete,
    isDeleting,
    depth = 0,
}: CommentItemProps) => {
    const currentUserId = authStorage.getUser<User>()?.id;
    const isOwner = currentUserId === comment.userId;
    const [showActions, setShowActions] = useState(false);

    return (
        <div className={`flex gap-3 ${depth > 0 ? "ml-6" : ""} py-3`}>
            {/* Avatar */}
            {comment.user.avatar && (
                <img
                    src={comment.user.avatar}
                    alt={comment.user.fullName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                />
            )}

            {/* Comment Content */}
            <div className="flex-grow min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 text-sm">
                            {comment.user.fullName}
                        </p>
                        <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
                    </div>

                    {isOwner && (
                        <DropdownMenu open={showActions} onOpenChange={setShowActions}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => {
                                        onEdit?.(comment);
                                        setShowActions(false);
                                    }}
                                >
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        onDelete?.(comment.id);
                                        setShowActions(false);
                                    }}
                                    className="text-destructive"
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Comment Text */}
                <p className="text-slate-700 text-sm mb-2 break-words">{comment.content}</p>

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