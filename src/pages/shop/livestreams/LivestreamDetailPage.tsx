import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Loader2, SendHorizontal, Users, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useCreateLivestreamComment,
    useIssueLivestreamAgoraToken,
    useLivestreamById,
    useLivestreamComments,
    useLivestreamRealtime,
} from "@/hooks/useLivestreams";
import { authStorage } from "@/lib/auth";

const formatCommentTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";

    const now = new Date();
    const isSameDay =
        now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();

    if (isSameDay) {
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const LivestreamDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const livestreamId = Number(id);
    const isValidId = Number.isInteger(livestreamId) && livestreamId > 0;
    const hasToken = Boolean(authStorage.getAccessToken());

    const [message, setMessage] = useState("");
    const [viewerCount, setViewerCount] = useState<number | null>(null);
    const chatScrollRef = useRef<HTMLDivElement | null>(null);
    const livestreamQuery = useLivestreamById(isValidId ? livestreamId : null, isValidId);
    const commentsQuery = useLivestreamComments(isValidId ? livestreamId : null, {
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "ASC",
    }, isValidId);
    const createCommentMutation = useCreateLivestreamComment();
    const issueTokenMutation = useIssueLivestreamAgoraToken();

    useLivestreamRealtime({
        livestreamId: isValidId ? livestreamId : undefined,
        enabled: isValidId && hasToken,
        onViewerCountUpdated: (count) => setViewerCount(count),
    });

    const livestream = livestreamQuery.data?.data;
    const comments = commentsQuery.data?.data ?? [];
    const resolvedViewerCount = viewerCount ?? livestream?.viewerCount ?? 0;

    useEffect(() => {
        const element = chatScrollRef.current;
        if (!element) return;

        element.scrollTop = element.scrollHeight;
    }, [comments.length]);

    const sortedPinnedProducts = useMemo(
        () =>
            (livestream?.pinnedProducts ?? [])
                .slice()
                .sort((a, b) => a.position - b.position),
        [livestream?.pinnedProducts],
    );

    if (!isValidId) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-slate-600">Livestream không hợp lệ.</p>
                <Button className="mt-4" onClick={() => navigate("/livestreams")}>Quay lại danh sách</Button>
            </div>
        );
    }

    const handleGetAgoraToken = () => {
        issueTokenMutation.mutate(livestreamId, {
            onSuccess: ({ data }) => {
                toast.success(`Agora token sẵn sàng cho channel ${data.channel}`);
            },
            onError: (error) => toast.error(error.message),
        });
    };

    const handleSubmitComment = (event: FormEvent) => {
        event.preventDefault();
        const content = message.trim();
        if (!content) return;

        createCommentMutation.mutate(
            {
                id: livestreamId,
                payload: { content },
            },
            {
                onSuccess: () => setMessage(""),
                onError: (error) => toast.error(error.message),
            },
        );
    };

    return (
        <div className="space-y-6">
            {livestreamQuery.isLoading ? (
                <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loader2 className="size-6 animate-spin text-slate-500" />
                </div>
            ) : !livestream ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    Livestream không tồn tại hoặc đã bị ẩn.
                </div>
            ) : (
                <>
                    <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                        <div className="space-y-4">
                            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-black">
                                <div className="aspect-video w-full bg-linear-to-br from-slate-900 via-slate-800 to-slate-700">
                                    {livestream.coverImageUrl ? (
                                        <img src={livestream.coverImageUrl} alt={livestream.title} className="h-full w-full object-cover opacity-80" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-300">
                                            <Video className="size-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/20" />
                                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                                    LIVE
                                </div>
                                <div className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                                    <Users className="size-3.5" />
                                    {resolvedViewerCount} đang xem
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <h1 className="text-xl font-bold text-slate-900">{livestream.title}</h1>
                                <p className="mt-2 text-sm text-slate-600">{livestream.description || "Buổi livestream thời trang cùng ưu đãi độc quyền."}</p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Button variant="outline" onClick={handleGetAgoraToken} disabled={!hasToken || issueTokenMutation.isPending}>
                                        {issueTokenMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                                        Lấy Agora Token
                                    </Button>
                                    {!hasToken ? (
                                        <Button asChild>
                                            <Link to="/login">Đăng nhập để chat</Link>
                                        </Button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-800">Sản phẩm đang ghim</p>
                                {sortedPinnedProducts.length === 0 ? (
                                    <p className="mt-2 text-sm text-slate-500">Host chưa ghim sản phẩm nào.</p>
                                ) : (
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {sortedPinnedProducts.map((item) => (
                                            <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                                                <div className="flex flex-col gap-3 sm:flex-row">
                                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                                        {item.product?.images?.[0]?.imageUrl ? (
                                                            <img
                                                                src={item.product.images[0].imageUrl}
                                                                alt={item.product?.name || `Sản phẩm #${item.productId}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                                No image
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="line-clamp-2 text-sm font-medium text-slate-800">
                                                            {item.product?.name || `Sản phẩm #${item.productId}`}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.product?.price ? `${Number(item.product.price).toLocaleString("vi-VN")}đ` : "Đang cập nhật giá"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button asChild className="mt-3 w-full" size="sm" variant="outline">
                                                    <Link to={`/men/products/${item.productId}`}>Xem sản phẩm</Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="text-sm font-semibold text-slate-800">Realtime Chat</p>

                            <div ref={chatScrollRef} className="mt-3 h-[22rem] space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 sm:h-[26rem] lg:h-[30rem]">
                                {commentsQuery.isLoading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="size-5 animate-spin text-slate-500" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-sm text-slate-500">Chưa có bình luận nào.</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                                            <p className="text-xs font-semibold text-slate-700">
                                                {comment.user?.fullName || `User #${comment.userId}`} - {formatCommentTime(comment.createdAt)}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-800">{comment.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSubmitComment} className="mt-3 flex gap-2">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={hasToken ? "Nhập bình luận..." : "Đăng nhập để bình luận"}
                                    disabled={!hasToken || createCommentMutation.isPending}
                                />
                                <Button type="submit" disabled={!hasToken || createCommentMutation.isPending || message.trim().length === 0}>
                                    {createCommentMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
                                </Button>
                            </form>
                        </aside>
                    </section>
                </>
            )}
        </div>
    );
};

export default LivestreamDetailPage;
