import {
  ArrowUpRight,
  CircleDollarSign,
  Package,
  ShoppingBag,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useDashboardOverview } from "@/hooks/useDashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardTimeRange } from "@/types/dashboard";

type OverviewMetric = {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: typeof CircleDollarSign;
};

type TimeRange = "7d" | "30d" | "quarter";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-sky-500",
  awaiting_pickup: "bg-cyan-500",
  in_transit: "bg-violet-500",
  out_for_delivery: "bg-fuchsia-500",
  delivered: "bg-emerald-500",
  delivery_failed: "bg-orange-500",
  canceled: "bg-rose-500",
};

const CATEGORY_COLORS = [
  "#40BFFF",
  "#22C55E",
  "#F59E0B",
  "#A78BFA",
  "#F97316",
  "#06B6D4",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const toNumber = (value: number | string) => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRangeLabel = (range: TimeRange) => {
  if (range === "30d") return "30 ngày";
  if (range === "quarter") return "quý gần nhất";
  return "7 ngày";
};

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>("7d");

  const overviewQuery = useDashboardOverview({
    timeRange,
  });

  const overview = overviewQuery.data?.data;

  const metricsSource = overview?.metrics;
  const revenueGrowth = toNumber(metricsSource?.revenue.changePercent ?? 0);
  const orderGrowth = toNumber(metricsSource?.orders.changePercent ?? 0);
  const userGrowth = toNumber(metricsSource?.newUsers.changePercent ?? 0);

  const metrics: OverviewMetric[] = [
    {
      title: `Doanh thu ${getRangeLabel(timeRange)}`,
      value: formatCurrency(toNumber(metricsSource?.revenue.value ?? 0)),
      change: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% so với kỳ trước`,
      positive: revenueGrowth >= 0,
      icon: CircleDollarSign,
    },
    {
      title: `Đơn hàng ${getRangeLabel(timeRange)}`,
      value: String(metricsSource?.orders.value ?? 0),
      change: `${orderGrowth >= 0 ? "+" : ""}${orderGrowth.toFixed(1)}% so với kỳ trước`,
      positive: orderGrowth >= 0,
      icon: ShoppingBag,
    },
    {
      title: `Khách hàng mới ${getRangeLabel(timeRange)}`,
      value: String(metricsSource?.newUsers.value ?? 0),
      change: `${userGrowth >= 0 ? "+" : ""}${userGrowth.toFixed(1)}% so với kỳ trước`,
      positive: userGrowth >= 0,
      icon: UserRound,
    },
    {
      title: "Sản phẩm sắp hết",
      value: String(metricsSource?.lowStock.value ?? 0),
      change: `Ngưỡng tồn kho <= ${metricsSource?.lowStock.threshold ?? 10}`,
      icon: Package,
    },
  ];

  const orderStatus = (overview?.charts.orderStatusSeries ?? []).map(
    (item) => ({
      label: item.label,
      value: item.count,
      color: STATUS_COLORS[item.status] ?? "bg-slate-400",
      percent: item.percent,
    }),
  );

  const filteredRevenueSeries = (overview?.charts.revenueSeries ?? []).map(
    (item) => ({
      day: item.label,
      revenue: toNumber(item.revenue),
    }),
  );

  const categoryShare = (overview?.charts.categoryShare ?? []).map(
    (item, index) => ({
      label: item.label,
      value: item.value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }),
  );

  const recentActivities = overview?.recentActivities ?? [];

  const chartLabel = useMemo(() => {
    if (timeRange === "30d") return "Biểu đồ doanh thu 30 ngày";
    if (timeRange === "quarter") return "Biểu đồ doanh thu quý gần nhất";
    return "Biểu đồ doanh thu 7 ngày";
  }, [timeRange]);

  const chartWidth = 560;
  const chartHeight = 210;
  const maxRevenue = Math.max(
    ...filteredRevenueSeries.map((item) => item.revenue),
    0,
  );
  const minRevenue = Math.min(
    ...filteredRevenueSeries.map((item) => item.revenue),
    0,
  );
  const range = Math.max(maxRevenue - minRevenue, 1);

  const revenuePoints = filteredRevenueSeries
    .map((item, index) => {
      const x =
        (index / Math.max(filteredRevenueSeries.length - 1, 1)) * chartWidth;
      const y =
        chartHeight -
        ((item.revenue - minRevenue) / range) * (chartHeight - 28) -
        14;
      return `${x},${y}`;
    })
    .join(" ");

  const donutGradient = (() => {
    let cursor = 0;
    const segments = categoryShare.map((item) => {
      const start = cursor;
      const end = cursor + item.value;
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  })();

  const isLoading = overviewQuery.isLoading;
  const hasError = overviewQuery.isError;

  return (
    <div className="relative w-full space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(64,191,255,0.18),transparent_50%),radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.14),transparent_40%)]" />

      <section className="rounded-3xl border border-slate-200/80 bg-white/85 p-5 backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              Dashboard tổng quan
            </p>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Bảng điều khiển quản trị FShop
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 md:text-base">
              Theo dõi doanh thu, hiệu suất đơn hàng và tình trạng vận hành
              trong một màn hình.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <div className="flex justify-end">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as DashboardTimeRange)}
          >
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue placeholder="Khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày gần nhất</SelectItem>
              <SelectItem value="30d">30 ngày gần nhất</SelectItem>
              <SelectItem value="quarter">Theo quý</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.title}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="mb-5 flex items-start justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {metric.title}
                </span>
                <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {metric.value}
              </p>
              <p
                className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
                  metric.positive ? "text-emerald-600" : "text-slate-600"
                }`}
              >
                {metric.positive && <ArrowUpRight className="size-3.5" />}
                {metric.change}
              </p>
            </article>
          );
        })}
      </section>

      {(isLoading || hasError) && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm">
          {isLoading && (
            <p className="text-slate-600">Đang tải dữ liệu dashboard...</p>
          )}
          {hasError && (
            <p className="text-rose-600">
              Không thể tải dữ liệu dashboard. Vui lòng kiểm tra quyền admin/API
              mới.
            </p>
          )}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {chartLabel}
            </h2>
            <span
              className={`text-xs font-medium ${revenueGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}`}
            >
              {revenueGrowth >= 0 ? "+" : ""}
              {revenueGrowth.toFixed(1)}% so với kỳ trước
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full sm:min-w-[560px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight + 28}`}
                className="h-64 w-full"
              >
                <defs>
                  <linearGradient id="revenueLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#40BFFF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3].map((tick) => {
                  const y = 20 + (tick * (chartHeight - 20)) / 3;
                  return (
                    <line
                      key={tick}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 6"
                    />
                  );
                })}

                <polyline
                  fill="none"
                  stroke="url(#revenueLine)"
                  strokeWidth="4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={revenuePoints}
                />

                {filteredRevenueSeries.map((item, index) => {
                  const x =
                    (index / Math.max(filteredRevenueSeries.length - 1, 1)) *
                    chartWidth;
                  const y =
                    chartHeight -
                    ((item.revenue - minRevenue) / range) * (chartHeight - 28) -
                    14;
                  return (
                    <g key={`${item.day}-${index}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r="6"
                        fill="#fff"
                        stroke="#40BFFF"
                        strokeWidth="3"
                      />
                      <text
                        x={x}
                        y={chartHeight + 22}
                        textAnchor="middle"
                        className="fill-slate-500 text-xs font-medium"
                      >
                        {item.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Cơ cấu ngành hàng
          </h2>
          <div className="flex items-center justify-center py-2">
            <div
              className="relative h-40 w-40 rounded-full"
              style={{ backgroundImage: donutGradient }}
              aria-label="Category share chart"
              role="img"
            >
              <div className="absolute inset-5 rounded-full bg-white" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {categoryShare.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <span className="font-semibold text-slate-900">
                  {item.value}%
                </span>
              </div>
            ))}
            {categoryShare.length === 0 && (
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu sản phẩm.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Trạng thái đơn hàng
            </h2>
            <span className="text-xs font-medium text-slate-500">Hôm nay</span>
          </div>

          <div className="space-y-4">
            {orderStatus.map((status) => (
              <div key={status.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {status.label}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {status.value}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${status.color}`}
                    style={{ width: `${Math.min(status.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {orderStatus.length === 0 && (
              <p className="text-sm text-slate-500">
                Không có đơn hàng trong bộ lọc hiện tại.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Việc cần xử lý
          </h2>
          <ul className="space-y-3">
            <li className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4" />
                {metricsSource?.lowStock.value ?? 0} sản phẩm dưới ngưỡng tồn
                kho tối thiểu.
              </div>
            </li>
            <li className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
              Tổng đơn trong kỳ lọc: {metricsSource?.orders.value ?? 0} đơn.
            </li>
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Hoạt động gần đây
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {recentActivities.map((activity) => (
            <div
              key={`${activity.type}-${activity.title}-${activity.time}`}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <p className="font-medium text-slate-800">{activity.title}</p>
              <p className="mt-1">{activity.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(activity.time).toLocaleString("vi-VN")}
              </p>
            </div>
          ))}
          {recentActivities.length === 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Chưa có hoạt động trong bộ lọc hiện tại.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
