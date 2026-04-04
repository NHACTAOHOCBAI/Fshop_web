import { Link } from "react-router";
import { Loader2, Users, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLivestreams } from "@/hooks/useLivestreams";
import type { LivestreamStatus } from "@/types/livestream";

const statusText: Record<LivestreamStatus, string> = {
    scheduled: "Sắp diễn ra",
    live: "Đang live",
    ended: "Đã kết thúc",
};

const statusColor: Record<LivestreamStatus, string> = {
    scheduled: "bg-amber-100 text-amber-800",
    live: "bg-red-100 text-red-800",
    ended: "bg-slate-100 text-slate-700",
};

const LivestreamListPage = () => {
    const livestreamsQuery = useLivestreams({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "DESC" });
    const livestreams = livestreamsQuery.data?.data ?? [];

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-sky-900 to-cyan-700 p-6 text-white md:p-10">
                <div className="absolute -right-14 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative max-w-2xl">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                        <Video className="size-3.5" />
                        FShop Live Runway
                    </p>
                    <h1 className="mt-3 text-3xl font-bold md:text-4xl">Livestream thời trang đang phát sóng</h1>
                    <p className="mt-2 text-sm text-slate-100 md:text-base">Theo dõi phiên live mới nhất, chat trực tiếp và săn deal ngay trong buổi phát.</p>
                </div>
            </section>

            {livestreamsQuery.isLoading ? (
                <div className="flex h-52 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loader2 className="size-6 animate-spin text-slate-500" />
                </div>
            ) : livestreams.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Hiện chưa có livestream nào.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {livestreams.map((item) => (
                        <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="relative h-48 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50">
                                {item.coverImageUrl ? (
                                    <img src={item.coverImageUrl} alt={item.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-slate-500">
                                        <Video className="size-8" />
                                    </div>
                                )}
                                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[item.status]}`}>
                                    {statusText[item.status]}
                                </span>
                            </div>

                            <div className="space-y-3 p-4">
                                <h2 className="line-clamp-1 text-lg font-semibold text-slate-900">{item.title}</h2>
                                <p className="line-clamp-2 text-sm text-slate-500">{item.description || "Phiên live giới thiệu sản phẩm mới và ưu đãi trong thời gian giới hạn."}</p>

                                <div className="flex items-center justify-between text-xs text-slate-600">
                                    <span>{new Date(item.scheduledStartAt).toLocaleString("vi-VN")}</span>
                                    <span className="inline-flex items-center gap-1">
                                        <Users className="size-3.5" />
                                        {item.viewerCount}
                                    </span>
                                </div>

                                <Button asChild className="w-full">
                                    <Link to={`/livestreams/${item.id}`}>Xem livestream</Link>
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LivestreamListPage;
