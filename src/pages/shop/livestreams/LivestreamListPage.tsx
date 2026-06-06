import { Link } from "react-router";
import { Loader2, Users, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLivestreams } from "@/hooks/useLivestreams";
import type { LivestreamStatus } from "@/types/livestream";

const statusText: Record<LivestreamStatus, string> = {
    scheduled: "Chưa diễn ra",
    live: "Đang phát",
    ended: "Đã kết thúc",
};

const statusColor: Record<LivestreamStatus, string> = {
    scheduled: "bg-amber-50 text-amber-700 border border-amber-200/60",
    live: "bg-red-50 text-red-700 border border-red-200/60 animate-pulse",
    ended: "bg-slate-100 text-slate-600 border border-slate-200/60",
};

const LivestreamListPage = () => {
    const livestreamsQuery = useLivestreams({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "DESC" });
    const livestreams = livestreamsQuery.data?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">FShop Live</p>
                <h1 className="text-2xl font-bold text-slate-900">Runway & Trực tiếp</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi livestream giới thiệu thời trang mới nhất, săn deal cực đỉnh và trò chuyện cùng host.</p>
            </div>

            {livestreamsQuery.isLoading ? (
                <div className="flex h-60 items-center justify-center rounded-2xl border border-slate-100 bg-white">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <span className="text-xs text-slate-400">Đang tải danh sách livestream...</span>
                    </div>
                </div>
            ) : livestreams.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-white py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <Video className="size-10 opacity-30 text-slate-500" />
                    <p className="text-sm font-medium">Hiện tại không có buổi livestream nào.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {livestreams.map((item) => (
                        <article 
                            key={item.id} 
                            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 flex flex-col h-full"
                        >
                            <div className="relative aspect-video w-full bg-slate-50 overflow-hidden shrink-0">
                                {item.coverImageUrl ? (
                                    <img 
                                        src={item.coverImageUrl} 
                                        alt={item.title} 
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-slate-300">
                                        <Video className="size-10" />
                                    </div>
                                )}
                                <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm z-10 border ${statusColor[item.status]}`}>
                                    {statusText[item.status]}
                                </span>
                            </div>

                            <div className="flex flex-col flex-1 p-5 justify-between">
                                <div className="space-y-2">
                                    <h2 className="line-clamp-1 text-base font-bold text-slate-800 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h2>
                                    <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
                                        {item.description || "Phiên livestream trình diễn xu hướng thời trang mới cùng nhiều mã giảm giá và quà tặng hấp dẫn."}
                                    </p>
                                </div>

                                <div className="mt-5 space-y-4">
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-3">
                                        <span className="font-medium">
                                            {new Date(item.scheduledStartAt).toLocaleString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-semibold text-slate-500">
                                            <Users className="size-3 text-slate-400" />
                                            {item.viewerCount} xem
                                        </span>
                                    </div>

                                    <Button asChild className="w-full h-9 text-xs font-semibold rounded-xl" variant={item.status === "live" ? "default" : "outline"}>
                                        <Link to={`/livestreams/${item.id}`}>
                                            {item.status === "live" ? "Tham gia xem ngay" : "Xem chi tiết"}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LivestreamListPage;
