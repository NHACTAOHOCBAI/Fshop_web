import { Clock, MessageSquare, Package, ShoppingBag, TrendingUp, Users } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLivestreamSummary } from "@/hooks/useLivestreams";

type Props = {
    livestreamId: number | null;
    open: boolean;
    onClose: () => void;
};

const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}g ${m}p ${s}s`;
    if (m > 0) return `${m}p ${s}s`;
    return `${s}s`;
};

const formatVND = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export const LivestreamSummaryModal = ({ livestreamId, open, onClose }: Props) => {
    const summaryQuery = useLivestreamSummary(open && livestreamId !== null ? livestreamId : null);
    const summary = summaryQuery.data?.data;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="size-5 text-indigo-600" />
                        Tổng kết phiên live
                    </DialogTitle>
                </DialogHeader>

                {summaryQuery.isLoading ? (
                    <div className="flex h-40 items-center justify-center text-slate-500 text-sm">
                        Đang tải tổng kết...
                    </div>
                ) : !summary ? (
                    <div className="flex h-40 items-center justify-center text-slate-500 text-sm">
                        Không tải được dữ liệu tổng kết.
                    </div>
                ) : (
                    <div className="space-y-5">
                        <p className="text-sm font-semibold text-slate-700">{summary.title}</p>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <MetricCard
                                icon={<Clock className="size-4 text-blue-600" />}
                                label="Thời gian phát"
                                value={formatDuration(summary.durationSeconds)}
                                bg="bg-blue-50"
                            />
                            <MetricCard
                                icon={<Users className="size-4 text-green-600" />}
                                label="Lượt xem"
                                value={summary.totalViewers.toLocaleString("vi-VN")}
                                bg="bg-green-50"
                            />
                            <MetricCard
                                icon={<MessageSquare className="size-4 text-amber-600" />}
                                label="Bình luận"
                                value={summary.totalComments.toLocaleString("vi-VN")}
                                bg="bg-amber-50"
                            />
                            <MetricCard
                                icon={<ShoppingBag className="size-4 text-violet-600" />}
                                label="Đơn hàng"
                                value={summary.totalOrders.toLocaleString("vi-VN")}
                                bg="bg-violet-50"
                            />
                            <MetricCard
                                icon={<TrendingUp className="size-4 text-rose-600" />}
                                label="Doanh thu"
                                value={formatVND(summary.totalRevenue)}
                                bg="bg-rose-50"
                                wide
                            />
                        </div>

                        {summary.topProducts.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                                    <Package className="size-3.5" />
                                    Sản phẩm bán được
                                </p>
                                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                    {summary.topProducts.map((p) => (
                                        <div
                                            key={p.productId}
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {p.imageUrl && (
                                                    <img
                                                        src={p.imageUrl}
                                                        alt={p.name}
                                                        className="size-8 shrink-0 rounded object-cover"
                                                    />
                                                )}
                                                <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                                            </div>
                                            <div className="shrink-0 text-right ml-3">
                                                <p className="text-xs text-slate-500">{p.unitsSold} sản phẩm</p>
                                                <p className="text-xs font-semibold text-slate-800">{formatVND(p.revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {summary.topProducts.length === 0 && (
                            <p className="text-center text-sm text-slate-400">Không có đơn hàng nào trong phiên live này.</p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

const MetricCard = ({
    icon,
    label,
    value,
    bg,
    wide = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    bg: string;
    wide?: boolean;
}) => (
    <div className={`rounded-xl ${bg} p-3 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {icon}
            {label}
        </div>
        <p className="mt-1.5 text-lg font-bold text-slate-900 truncate">{value}</p>
    </div>
);
