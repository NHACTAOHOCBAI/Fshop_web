import { Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const resizeTextarea = () => {
        if (!textareaRef.current) return;

        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    };

    useEffect(() => {
        if (replyingTo) {
            textareaRef.current?.focus();
        }
    }, [replyingTo]);

    useEffect(() => {
        resizeTextarea();
    }, [content]);

    const handleSubmit = () => {
        if (!content.trim()) return;
        onSubmit(content);
        setContent("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 ">
            {/* Reply To Info */}
            {replyingTo && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-sky-50 px-2.5 py-1.5">
                    <p className="text-xs text-slate-700">
                        Trả lời: <span className="font-semibold">{replyingTo.user.fullName}</span>
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-500 hover:text-slate-800"
                        onClick={onCancelReply}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Form */}
            <div className="space-y-2">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={replyingTo ? "Viết câu trả lời..." : "Viết bình luận..."}
                    className="min-h-14 max-h-45 resize-none border-slate-200 bg-slate-50 focus-visible:ring-1"
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