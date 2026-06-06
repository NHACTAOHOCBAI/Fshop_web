import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useModerationRecent,
  useModerationStats,
} from "@/hooks/useModeration";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ModerationLog } from "@/types/moderation";

const LABEL_DISPLAY: Record<string, string> = {
  toxic: "Độc hại / Thô tục",
  spam: "Spam / Rác",
  hate_speech: "Kích động thù hận",
  nsfw: "Nhạy cảm / 18+",
  off_topic: "Không liên quan",
};

const CONTENT_TYPE_LABELS: Record<ModerationLog["contentType"], string> = {
  post: "Bài viết",
  review: "Đánh giá",
  post_comment: "Bình luận",
  livestream_comment: "Bình luận Live",
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const formatDateTime = (value: string | null) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const ModerationItemsTable = ({
  title,
  description,
  items,
  isLoading,
  emptyText,
  timeLabel,
  getTime,
  action,
}: {
  title: string;
  description: string;
  items: ModerationLog[];
  isLoading: boolean;
  emptyText: string;
  timeLabel: string;
  getTime: (item: ModerationLog) => string | null;
  action?: {
    label: string;
    to: string;
  };
}) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white">
    <div className="flex flex-row items-center justify-between p-5 border-b pb-4">
      <div>
        <h3 className="font-semibold text-base leading-none text-slate-900">{title}</h3>
        <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button asChild variant="outline" size="sm" className="h-8 text-xs font-medium">
          <Link to={action.to} className="flex items-center gap-1">
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      )}
    </div>
    <div className="p-5 pt-0">
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground text-center py-4">
          {emptyText}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28 text-slate-500 font-semibold text-xs uppercase">Loại</TableHead>
                <TableHead className="text-slate-500 font-semibold text-xs uppercase">Nội dung</TableHead>
                <TableHead className="w-24 text-right text-slate-500 font-semibold text-xs uppercase">Điểm số</TableHead>
                <TableHead className="w-24 text-slate-500 font-semibold text-xs uppercase">Độ ưu tiên</TableHead>
                <TableHead className="w-32 text-right text-slate-500 font-semibold text-xs uppercase">{timeLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-medium py-0.5 px-2 bg-slate-100 text-slate-700">
                      {CONTENT_TYPE_LABELS[item.contentType]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-1 max-w-md text-xs font-medium text-slate-700">
                      {item.contentText}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                      ID #{item.contentId}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs tabular-nums text-slate-700">
                    {formatPercent(item.finalScore)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.priority === "HIGH" ? "destructive" : "outline"}
                      className={`text-[9px] font-semibold tracking-wider px-1.5 py-0.5 ${
                        item.priority === "HIGH" ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {item.priority === "HIGH" ? "CAO" : "THƯỜNG"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">
                    {formatDateTime(getTime(item))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  </div>
);

const ModerationDashboard = () => {
  const { data: stats, isLoading } = useModerationStats();
  const { data: recent, isLoading: isRecentLoading } = useModerationRecent(6);

  const statsData = stats?.data;
  const recentData = recent?.data;
  const labelChartData = statsData?.labelDistribution
    ? Object.entries(statsData.labelDistribution).map(([key, count]) => ({
        label: LABEL_DISPLAY[key] ?? key,
        count,
      }))
    : [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold">Giám sát & Kiểm duyệt</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Giám sát nội dung vi phạm, xử lý các phản hồi từ bộ lọc tự động và đưa ra quyết định phê duyệt.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="mb-5 flex items-start justify-between">
            <span className="text-sm font-medium text-slate-500">Tổng bị gắn cờ</span>
            <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statsData?.totalFlagged ?? 0}</p>
        </article>

        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="mb-5 flex items-start justify-between">
            <span className="text-sm font-medium text-slate-500">Chờ xem xét</span>
            <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statsData?.pendingReview ?? 0}</p>
        </article>

        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="mb-5 flex items-start justify-between">
            <span className="text-sm font-medium text-slate-500">Ưu tiên cao</span>
            <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statsData?.highPriority ?? 0}</p>
        </article>

        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="mb-5 flex items-start justify-between">
            <span className="text-sm font-medium text-slate-500">Đã từ chối</span>
            <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
              <XCircle className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statsData?.rejected ?? 0}</p>
        </article>

        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="mb-5 flex items-start justify-between">
            <span className="text-sm font-medium text-slate-500">Tỷ lệ tự động duyệt</span>
            <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{statsData?.autoApprovedRate ?? 0}%</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {/* Main Content Area */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <ModerationItemsTable
            title="Mới bị gắn cờ"
            description="Nội dung mới nhất đang chờ Admin kiểm duyệt."
            items={recentData?.flagged ?? []}
            isLoading={isRecentLoading}
            emptyText="Không có nội dung bị gắn cờ nào đang chờ duyệt."
            timeLabel="Thời gian gắn cờ"
            getTime={(item) => item.createdAt}
            action={{
              label: "Mở hàng chờ",
              to: "/admin/moderation/queue?status=pending",
            }}
          />
          <ModerationItemsTable
            title="Đã bị từ chối bởi Admin"
            description="Nội dung đã được xem xét và từ chối."
            items={recentData?.rejected ?? []}
            isLoading={isRecentLoading}
            emptyText="Không có bản ghi nội dung nào bị từ chối."
            timeLabel="Thời gian duyệt"
            getTime={(item) => item.reviewedAt ?? item.createdAt}
            action={{
              label: "Xem danh sách từ chối",
              to: "/admin/moderation/queue?status=rejected",
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick link widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2 mb-3">
              <ShieldAlert className="size-4 text-primary" /> Xử lý vi phạm
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Truy cập hàng chờ kiểm duyệt để phê duyệt hoặc từ chối hàng loạt nội dung bị gắn cờ từ hệ thống lọc tự động.
            </p>
            <Button asChild className="w-full text-xs h-9 justify-center bg-slate-900 hover:bg-sky-500 hover:text-white transition-colors" size="sm">
              <Link to="/admin/moderation/queue">
                Đến hàng chờ kiểm duyệt
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Label Distribution Chart widget */}
          {labelChartData.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2 mb-3">
                <AlertTriangle className="size-4 text-primary" /> Phân bổ nhãn vi phạm
              </h3>
              <p className="text-[11px] text-muted-foreground mb-4">Thống kê trên 500 nội dung bị gắn cờ gần nhất</p>
              <div className="space-y-3">
                {(() => {
                  const max = Math.max(...labelChartData.map((d) => d.count), 1);
                  return labelChartData.map((d) => (
                    <div key={d.label} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>{d.label}</span>
                        <span className="tabular-nums">{d.count}</span>
                      </div>
                      <div className="overflow-hidden rounded-full bg-slate-100 h-2">
                        <div
                          className="h-full rounded-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${(d.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Guidelines widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2 mb-3">
              <BookOpen className="size-4 text-primary" /> Quy tắc kiểm duyệt AI
            </h3>
            <ul className="text-xs space-y-2 text-slate-600 list-disc list-inside">
              <li>Bộ lọc tự động sẽ gắn cờ khi điểm số vi phạm (ML Score) vượt ngưỡng 0.4.</li>
              <li>Nội dung có mức ưu tiên <strong>HIGH</strong> cần được xử lý trong vòng 24 giờ.</li>
              <li>Admin có quyền ghi đè (override) quyết định phê duyệt hoặc từ chối bất kỳ lúc nào.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;
