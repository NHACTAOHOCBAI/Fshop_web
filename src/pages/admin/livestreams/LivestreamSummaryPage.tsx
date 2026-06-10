import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import {
    ArrowLeft,
    Clock,
    MessageSquare,
    Package,
    ShoppingBag,
    TrendingUp,
    Users,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLivestreamSummary } from "@/hooks/useLivestreams";

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
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);

const colors = ["#40BFFF", "#22C55E", "#F59E0B", "#A78BFA", "#F97316", "#06B6D4"];

export default function LivestreamSummaryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const livestreamId = Number(id);
    const isValidId = Number.isInteger(livestreamId) && livestreamId > 0;

    const summaryQuery = useLivestreamSummary(isValidId ? livestreamId : null);
    const summary = summaryQuery.data?.data;

    // Calculate revenue breakdown for charts
    const productsShare = useMemo(() => {
        if (!summary || summary.totalRevenue <= 0) return [];
        let totalAssigned = 0;
        const items = summary.topProducts.slice(0, 5).map((item, index) => {
            const percent = Math.max(0, Math.min(100, Math.round((item.revenue / summary.totalRevenue) * 100)));
            totalAssigned += percent;
            return {
                label: item.name,
                value: percent,
                revenue: item.revenue,
                color: colors[index % colors.length],
            };
        });

        if (totalAssigned < 100 && summary.topProducts.length > 5) {
            const remainingRevenue = summary.totalRevenue - items.reduce((sum, i) => sum + i.revenue, 0);
            if (remainingRevenue > 0) {
                items.push({
                    label: "Sản phẩm khác",
                    value: 100 - totalAssigned,
                    revenue: remainingRevenue,
                    color: colors[items.length % colors.length],
                });
            }
        }
        return items;
    }, [summary]);

    // Donut chart style gradient
    const donutGradient = useMemo(() => {
        if (productsShare.length === 0) return "conic-gradient(#e2e8f0 0% 100%)";
        let cursor = 0;
        const segments = productsShare.map((item) => {
            const start = cursor;
            const end = cursor + item.value;
            cursor = end;
            return `${item.color} ${start}% ${end}%`;
        });
        return `conic-gradient(${segments.join(", ")})`;
    }, [productsShare]);



    if (!isValidId) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-600">Mã livestream không hợp lệ.</p>
                <Button className="mt-4" onClick={() => navigate("/admin/livestreams")}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    if (summaryQuery.isLoading) {
        return (
            <div className="flex h-96 items-center justify-center gap-2">
                <Loader2 className="size-6 animate-spin text-slate-500" />
                <span className="text-sm text-slate-500 font-medium">Đang tải báo cáo tổng kết...</span>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-600">Không tìm thấy báo cáo tổng kết cho phiên livestream này.</p>
                <Button className="mt-4" onClick={() => navigate("/admin/livestreams")}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="relative w-full space-y-6 print:p-0 print:space-y-4">
            {/* Ambient Background Glow (matching Dashboard) */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(64,191,255,0.12),transparent_50%)] print:hidden" />

            {/* Header Banner Section */}
            <div className="flex items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3 min-w-0">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        className="h-8 w-8 shrink-0"
                        onClick={() => navigate("/admin/livestreams")}
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-900 truncate">
                        {summary.title}
                    </h1>
                </div>
            </div>

            {/* Session Metadata Sub-bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
                <span className="font-semibold text-slate-700">Trạng thái: Đã kết thúc</span>
                <span>
                    Thời gian thực tế:{" "}
                    {summary.startedAt ? new Date(summary.startedAt).toLocaleString("vi-VN") : "Chưa bắt đầu"}{" "}
                    —{" "}
                    {summary.endedAt ? new Date(summary.endedAt).toLocaleString("vi-VN") : "Chưa kết thúc"}
                </span>
            </div>

            {/* KPI Cards Grid */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 print:grid-cols-5">
                <MetricCard
                    icon={<Clock className="size-4" />}
                    label="Thời gian phát"
                    value={formatDuration(summary.durationSeconds)}
                    hoverBg="group-hover:bg-sky-500"
                />
                <MetricCard
                    icon={<Users className="size-4" />}
                    label="Lượt xem"
                    value={summary.totalViewers.toLocaleString("vi-VN")}
                    hoverBg="group-hover:bg-emerald-500"
                />
                <MetricCard
                    icon={<MessageSquare className="size-4" />}
                    label="Bình luận"
                    value={summary.totalComments.toLocaleString("vi-VN")}
                    hoverBg="group-hover:bg-amber-500"
                />
                <MetricCard
                    icon={<ShoppingBag className="size-4" />}
                    label="Đơn hàng"
                    value={summary.totalOrders.toLocaleString("vi-VN")}
                    hoverBg="group-hover:bg-violet-500"
                />
                <MetricCard
                    icon={<TrendingUp className="size-4" />}
                    label="Doanh thu"
                    value={formatVND(summary.totalRevenue)}
                    hoverBg="group-hover:bg-rose-500"
                    wide
                />
            </section>

            {/* Charts Section */}
            <section className="grid gap-6 lg:grid-cols-3 print:grid-cols-3 print:gap-4">
                {/* Product Sales Share Donut Chart */}
                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between print:border print:p-4">
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                            Cơ cấu doanh thu
                        </h2>
                        {productsShare.length > 0 ? (
                            <div className="flex items-center justify-center py-4">
                                <div
                                    className="relative h-36 w-36 rounded-full"
                                    style={{ backgroundImage: donutGradient }}
                                >
                                    <div className="absolute inset-5 rounded-full bg-white flex flex-col items-center justify-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng thu</p>
                                        <p className="text-sm font-extrabold text-slate-900">
                                            {formatVND(summary.totalRevenue)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-36 items-center justify-center text-xs text-slate-400">
                                Không có dữ liệu phân tích cơ cấu.
                            </div>
                        )}
                    </div>
                    <div className="mt-4 space-y-1.5">
                        {productsShare.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-xs">
                                <span className="inline-flex items-center gap-2 text-slate-600 truncate max-w-[70%]">
                                    <span
                                        className="size-2 rounded-full shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="truncate">{item.label}</span>
                                </span>
                                <span className="font-bold text-slate-900 shrink-0">
                                    {item.value}%
                                </span>
                            </div>
                        ))}
                    </div>
                </article>

                {/* Horizontal Revenue Bar Chart */}
                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 lg:col-span-2 print:col-span-2 print:border print:p-4">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                        Doanh số theo sản phẩm
                    </h2>
                    {summary.topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {summary.topProducts.slice(0, 5).map((product, idx) => {
                                const maxRevenue = Math.max(...summary.topProducts.map((p) => p.revenue), 1);
                                const barWidth = Math.round((product.revenue / maxRevenue) * 100);
                                return (
                                    <div key={product.productId} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-slate-600 truncate max-w-[70%]">
                                                {product.name}
                                            </span>
                                            <span className="font-bold text-slate-900 shrink-0">
                                                {formatVND(product.revenue)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${barWidth}%`,
                                                        backgroundColor: colors[idx % colors.length],
                                                    }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 w-12 text-right shrink-0">
                                                {product.unitsSold} bán
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-48 items-center justify-center text-xs text-slate-400">
                            Không có dữ liệu sản phẩm trong phiên này.
                        </div>
                    )}
                </article>
            </section>

            {/* Top Pinned Products Performance List */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 print:border print:p-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Package className="size-4 text-slate-500" />
                    Hiệu quả bán hàng của sản phẩm
                </h2>

                {summary.topProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                                    <th className="py-2.5 pb-3 font-semibold text-center w-12">Hạng</th>
                                    <th className="py-2.5 pb-3 font-semibold">Sản phẩm</th>
                                    <th className="py-2.5 pb-3 font-semibold text-center w-28">Số lượng đã bán</th>
                                    <th className="py-2.5 pb-3 font-semibold text-right w-36">Doanh thu đạt được</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.topProducts.map((p, idx) => {
                                    const isTop1 = idx === 0;
                                    const isTop2 = idx === 1;
                                    const isTop3 = idx === 2;

                                    const badgeBg = isTop1
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : isTop2
                                        ? "bg-slate-50 text-slate-600 border-slate-200"
                                        : isTop3
                                        ? "bg-orange-50 text-orange-700 border-orange-200"
                                        : "bg-slate-100 text-slate-500 border-transparent";

                                    return (
                                        <tr key={p.productId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 text-center">
                                                <span className={`inline-flex size-6 items-center justify-center rounded-full border text-[10px] font-bold ${badgeBg}`}>
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-3">
                                                    {p.imageUrl ? (
                                                        <img
                                                            src={p.imageUrl}
                                                            alt={p.name}
                                                            className="size-10 rounded-lg object-cover border border-slate-100"
                                                        />
                                                    ) : (
                                                        <div className="flex size-10 items-center justify-center rounded-lg bg-slate-50 text-[10px] text-slate-400 font-medium">N/A</div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-slate-800 line-clamp-1">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">Mã sản phẩm: #{p.productId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 text-center font-semibold text-slate-700">
                                                {p.unitsSold} sản phẩm
                                            </td>
                                            <td className="py-3 text-right font-extrabold text-slate-900">
                                                {formatVND(p.revenue)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400">
                        Không có sản phẩm nào được bán ra trong phiên livestream này.
                    </div>
                )}
            </section>
        </div>
    );
}

const MetricCard = ({
    icon,
    label,
    value,
    hoverBg,
    wide = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    hoverBg: string;
    wide?: boolean;
}) => (
    <article className={`group rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 print:border print:bg-transparent ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
        <div className="mb-4 flex items-start justify-between print:mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
            </span>
            <div className={`rounded-xl bg-slate-900 p-1.5 text-white transition-colors print:hidden ${hoverBg}`}>
                {icon}
            </div>
        </div>
        <p className="text-lg font-bold text-slate-900 truncate">
            {value}
        </p>
    </article>
);
