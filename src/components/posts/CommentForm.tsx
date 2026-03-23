import { Loader2, Send, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PostComment } from "@/types/post";

interface CommentFormProps {
    onSubmit: (content: string) => void;
    isPending?: boolean;
    replyingTo?: PostComment | null;
    onCancelReply?: () => void;
}

const CommentForm = ({
    onSubmit,
    isPending = false,
    replyingTo,
    onCancelReply,
}: CommentFormProps) => {
    const [content, setContent] = useState("");

    const handleSubmit = () => {
        if (!content.trim()) return;
        onSubmit(content);
        setContent("");
    };

    return (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            {/* Reply To Info */}
            {replyingTo && (
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                    <p className="text-xs text-slate-600">
                        Trả lời: <span className="font-semibold">{replyingTo.user.fullName}</span>
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={onCancelReply}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Form */}
            <div className="space-y-3">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={replyingTo ? "Viết câu trả lời..." : "Viết bình luận..."}
                    className="min-h-[80px] resize-none focus-visible:ring-1"
                    maxLength={1000}
                />

                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{content.length}/1000</p>
                    <Button
                        onClick={handleSubmit}
                        disabled={!content.trim() || isPending}
                        size="sm"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                Đang gửi...
                            </>
                        ) : (
                            <>
                                <Send className="mr-1 h-4 w-4" />
                                Gửi
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CommentForm;