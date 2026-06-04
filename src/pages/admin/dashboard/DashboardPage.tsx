import {
  ArrowUpRight,
  CircleDollarSign,
  CalendarRange,
  MoveRight,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  UserRound,
  AlertCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";

import { useDashboardOverview } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { ORDER_STATUS_LABEL } from "@/constants/orderStatus";
import type { OrderStatus } from "@/types/order";
import { Link } from "react-router";

type OverviewMetric = {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: typeof CircleDollarSign;
};

type PriorityLevel = "high" | "medium" | "low";

const CHANNEL_COLORS = [
  "#40BFFF",
  "#22C55E",
  "#F59E0B",
  "#A78BFA",
  "#F97316",
  "#06B6D4",
];

const CATEGORY_COLORS = CHANNEL_COLORS;

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

const formatDisplayDate = (date: Date) =>
  format(date, "dd/MM/yyyy");

const getDefaultRange = () => {
  const endDate = new Date();
  const startDate = subDays(endDate, 6);
  return { startDate, endDate };
};

const formatWaitingTime = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} phút chờ`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours} giờ ${remainingMinutes} phút chờ`
      : `${hours} giờ chờ`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0
    ? `${days} ngày ${remainingHours} giờ chờ`
    : `${days} ngày chờ`;
};

const DashboardPage = () => {
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [draftStartDate, setDraftStartDate] = useState<Date | undefined>(
    defaultRange.startDate,
  );
  const [draftEndDate, setDraftEndDate] = useState<Date | undefined>(
    defaultRange.endDate,
  );
  const [appliedStartDate, setAppliedStartDate] = useState<Date>(
    defaultRange.startDate,
  );
  const [appliedEndDate, setAppliedEndDate] = useState<Date>(
    defaultRange.endDate,
  );

  const overviewQuery = useDashboardOverview(
    useMemo(
      () => ({
        startDate: format(appliedStartDate, "yyyy-MM-dd"),
        endDate: format(appliedEndDate, "yyyy-MM-dd"),
      }),
      [appliedStartDate, appliedEndDate],
    ),
  );

  const overview = overviewQuery.data?.data;
  const rangeLabel = `${formatDisplayDate(appliedStartDate)} - ${formatDisplayDate(appliedEndDate)}`;

  const metricsSource = overview?.metrics;
  const revenueGrowth = toNumber(metricsSource?.revenue.changePercent ?? 0);
  const orderGrowth = toNumber(metricsSource?.orders.changePercent ?? 0);
  const userGrowth = toNumber(metricsSource?.newUsers.changePercent ?? 0);

  const metrics: OverviewMetric[] = [
    {
      title: "Doanh thu",
      value: formatCurrency(toNumber(metricsSource?.revenue.value ?? 0)),
      change: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}% so với kỳ trước`,
      positive: revenueGrowth >= 0,
      icon: CircleDollarSign,
    },
    {
      title: "Đơn hàng",
      value: String(metricsSource?.orders.value ?? 0),
      change: `${orderGrowth >= 0 ? "+" : ""}${orderGrowth.toFixed(1)}% so với kỳ trước`,
      positive: orderGrowth >= 0,
      icon: ShoppingBag,
    },
    {
      title: "Khách hàng mới",
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

  const chartLabel = useMemo(
    () => `Biểu đồ doanh thu ${rangeLabel}`,
    [rangeLabel],
  );

  const analyticsSource = overview?.analytics;
  const conversionFunnel = analyticsSource?.conversionFunnel ?? [];
  const customerMix = analyticsSource?.customerMix;
  const performanceRates = analyticsSource?.performanceRates;
  const urgentOrders = analyticsSource?.urgentOrders ?? [];
  const topProducts = analyticsSource?.topProducts ?? [];
  const topCategories = analyticsSource?.topCategories ?? [];

  const handleApplyDateRange = () => {
    if (!draftStartDate || !draftEndDate) {
      return;
    }

    const startDate = draftStartDate <= draftEndDate ? draftStartDate : draftEndDate;
    const endDate = draftStartDate <= draftEndDate ? draftEndDate : draftStartDate;

    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  };

  const handleResetDateRange = () => {
    const resetRange = getDefaultRange();
    setDraftStartDate(resetRange.startDate);
    setDraftEndDate(resetRange.endDate);
    setAppliedStartDate(resetRange.startDate);
    setAppliedEndDate(resetRange.endDate);
  };

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



  const priorityStyles: Record<PriorityLevel, string> = {
    high: "border-rose-100 bg-rose-50 text-rose-700",
    medium: "border-amber-100 bg-amber-50 text-amber-700",
    low: "border-sky-100 bg-sky-50 text-sky-700",
  };

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarRange className="size-4 text-primary" />
              Bộ lọc thời gian
            </div>
            <p className="text-xs text-slate-500">
              Chọn ngày bắt đầu và ngày kết thúc để tải lại số liệu dashboard.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:min-w-[760px]">
            <DatePicker
              date={draftStartDate}
              onChange={setDraftStartDate}
              placeholder="Ngày bắt đầu"
            />
            <DatePicker
              date={draftEndDate}
              onChange={setDraftEndDate}
              placeholder="Ngày kết thúc"
            />
            <Button type="button" onClick={handleApplyDateRange}>
              Áp dụng
            </Button>
            <Button type="button" variant="outline" onClick={handleResetDateRange}>
              Xóa
            </Button>
          </div>
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
      </section>

      <section className="grid gap-4">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Phễu chuyển đổi
            </h2>
            <span className="text-xs font-medium text-slate-500">
              Theo bộ lọc hiện tại
            </span>
          </div>

          <div className="space-y-4">
            {conversionFunnel.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-700">
                      {stage.stage}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {stage.count.toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(stage.percent, 100)}%`,
                      backgroundColor: "#40BFFF",
                    }}
                  />
                </div>
              </div>
            ))}
            {conversionFunnel.length === 0 && (
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu phễu chuyển đổi cho khoảng thời gian này.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Top sản phẩm
            </h2>
            <ShoppingCart className="size-4 text-sky-500" />
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-700">
                      {product.name}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${Math.min(product.percent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {product.quantity} sản phẩm bán ra
                </p>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu top sản phẩm.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Top danh mục
            </h2>
            <Tag className="size-4 text-emerald-500" />
          </div>
          <div className="space-y-4">
            {topCategories.map((category, index) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-700">
                      {category.name}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(category.revenue)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(category.percent, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {topCategories.length === 0 && (
              <p className="text-sm text-slate-500">
                Chưa có dữ liệu top danh mục.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Đơn cần chú ý gấp
            </h2>
            <AlertCircle className="size-4 text-rose-500" />
          </div>
          <div className="space-y-3">
            {urgentOrders.map((order) => (
              <Link
                to={`/admin/orders/${order.id}`}
                key={order.id}
                className={`block rounded-xl border p-3 text-sm transition-all hover:opacity-90 hover:shadow-sm cursor-pointer ${priorityStyles[order.priority]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{order.code}</p>
                    <p className="mt-1 text-xs opacity-80">{order.customerName}</p>
                  </div>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    {order.priority}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs opacity-90">
                  <span>{ORDER_STATUS_LABEL[order.status as OrderStatus] || order.status}</span>
                  <span>{formatWaitingTime(order.waitingMinutes)}</span>
                </div>
                {order.note && (
                  <p className="mt-2 text-xs opacity-80">{order.note}</p>
                )}
              </Link>
            ))}
            {urgentOrders.length === 0 && (
              <p className="text-sm text-slate-500">
                Chưa có đơn cần chú ý gấp trong bộ lọc hiện tại.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Khách hàng mới vs quay lại
            </h2>
            <MoveRight className="size-4 text-slate-400" />
          </div>
          {customerMix ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Khách mới</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {customerMix.newCustomers.toLocaleString("vi-VN")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {customerMix.newRate}% tổng khách hàng
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Khách quay lại
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {customerMix.returningCustomers.toLocaleString("vi-VN")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {customerMix.returningRate}% tổng khách hàng
                  </p>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full w-full overflow-hidden rounded-full">
                  <div
                    className="bg-sky-500"
                    style={{ width: `${customerMix.newRate}%` }}
                  />
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${customerMix.returningRate}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Chưa có dữ liệu phân tách khách hàng mới và quay lại.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Tỷ lệ hủy và hoàn
          </h2>
          {performanceRates ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs font-medium text-rose-600">Tỷ lệ hủy</p>
                <p className="mt-2 text-2xl font-bold text-rose-700">
                  {performanceRates.cancellationRate}%
                </p>
                <p className="mt-1 text-xs text-rose-600/80">
                  Đơn bị hủy trong khoảng thời gian đã lọc
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-medium text-amber-600">Tỷ lệ hoàn</p>
                <p className="mt-2 text-2xl font-bold text-amber-700">
                  {performanceRates.returnRate}%
                </p>
                <p className="mt-1 text-xs text-amber-600/80">
                  Đơn hoàn/đổi trong khoảng thời gian đã lọc
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Chưa có dữ liệu tỷ lệ hủy và hoàn.
            </p>
          )}
        </article>
      </section>

    </div>
  );
};

export default DashboardPage;
