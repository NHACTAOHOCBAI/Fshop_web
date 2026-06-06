import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModerationQueue, useOverrideDecision } from "@/hooks/useModeration";
import type {
  ContentType,
  ModerationLog,
  ModerationPriority,
  ModerationQueueStatus,
} from "@/types/moderation";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  post: "Bài viết",
  review: "Đánh giá",
  post_comment: "Bình luận bài viết",
  livestream_comment: "Bình luận Live",
};

const LABEL_DISPLAY: Record<string, string> = {
  toxic: "Độc hại",
  spam: "Spam",
  hate_speech: "Kích động",
  nsfw: "Nhạy cảm",
  off_topic: "Lạc đề",
};

const LABEL_COLORS: Record<string, string> = {
  toxic: "bg-red-50 text-red-700 border-red-100",
  spam: "bg-amber-50 text-amber-700 border-amber-100",
  hate_speech: "bg-purple-50 text-purple-700 border-purple-100",
  nsfw: "bg-pink-50 text-pink-700 border-pink-100",
  off_topic: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_LABELS: Record<ModerationQueueStatus, string> = {
  pending: "Chờ xem xét",
  reviewed: "Đã xem xét",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const ScoreBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          score > 0.7 ? "bg-rose-500" : score > 0.4 ? "bg-amber-500" : "bg-emerald-500"
        }`}
        style={{ width: `${Math.round(score * 100)}%` }}
      />
    </div>
    <span className="text-[11px] font-semibold tabular-nums text-slate-500">
      {Math.round(score * 100)}%
    </span>
  </div>
);

const LogRow = ({ log }: { log: ModerationLog }) => {
  const [expanded, setExpanded] = useState(false);
  const { mutate: override, isPending } = useOverrideDecision();

  const topLabels = Object.entries(log.mlLabels ?? {})
    .filter(([, score]) => score > 0.4)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const handleApprove = () => {
    override(
      { logId: log.id, decision: "approved" },
      { onSuccess: () => toast.success("Đã phê duyệt nội dung thành công") }
    );
  };

  const handleReject = () => {
    override(
      { logId: log.id, decision: "rejected" },
      { onSuccess: () => toast.success("Đã từ chối nội dung thành công") }
    );
  };

  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3.5 text-center">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400 mx-auto" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 mx-auto" />
          )}
        </td>
        <td className="px-4 py-3.5">
          <Badge variant="secondary" className="text-[10px] font-medium py-0.5 px-2 bg-slate-100 text-slate-700">
            {CONTENT_TYPE_LABELS[log.contentType]}
          </Badge>
        </td>
        <td className="max-w-xs px-4 py-3.5">
          <p className="line-clamp-2 text-xs font-medium text-slate-700">{log.contentText}</p>
        </td>
        <td className="px-4 py-3.5">
          <ScoreBar score={log.finalScore} />
        </td>
        <td className="px-4 py-3.5">
          <div className="flex flex-wrap gap-1">
            {topLabels.length === 0 ? (
              <span className="text-[10px] text-slate-400 italic">Không phát hiện</span>
            ) : (
              topLabels.map(([label]) => (
                <span
                  key={label}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${LABEL_COLORS[label] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}
                >
                  {LABEL_DISPLAY[label] ?? label}
                </span>
              ))
            )}
          </div>
        </td>
        <td className="px-4 py-3.5">
          {log.priority === "HIGH" ? (
            <Badge variant="destructive" className="text-[9px] bg-red-50 text-red-700 border-red-200 font-semibold">CAO</Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 border-slate-200 font-semibold">THƯỜNG</Badge>
          )}
        </td>
        <td className="px-4 py-3.5 text-[11px] text-muted-foreground">
          {new Date(log.reviewedAt ?? log.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
            {log.isOverridden ? (
              <Badge
                variant={log.overrideDecision === "rejected" ? "destructive" : "default"}
                className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide ${
                  log.overrideDecision === "rejected" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {log.overrideDecision === "rejected" ? "Đã từ chối" : "Đã duyệt"}
              </Badge>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-2.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  onClick={handleApprove}
                  disabled={isPending}
                >
                  Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-2.5 border-rose-500 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={handleReject}
                  disabled={isPending}
                >
                  Từ chối
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b bg-slate-50/30">
          <td colSpan={8} className="px-8 py-5">
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nội dung đầy đủ
                </p>
                <p className="rounded-xl border border-slate-200/80 bg-white p-4 text-xs leading-relaxed text-slate-700 font-medium">
                  {log.contentText}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-100 p-3.5 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Điểm quy tắc (Rule Score)</span>
                  <ScoreBar score={log.ruleScore} />
                </div>
                <div className="bg-white border border-slate-100 p-3.5 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Điểm học máy (ML Score)</span>
                  <ScoreBar score={log.mlScore} />
                </div>
              </div>
              {Object.keys(log.mlLabels ?? {}).length > 0 && (
                <div>
                  <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Chi tiết điểm phát hiện của bộ lọc
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(log.mlLabels).map(([label, score]) => (
                      <div key={label} className="bg-white border border-slate-100 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          {LABEL_DISPLAY[label] ?? label}
                        </span>
                        <ScoreBar score={score} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const ModerationQueue = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status");
  const safeInitialStatus: ModerationQueueStatus =
    initialStatus === "reviewed" ||
    initialStatus === "approved" ||
    initialStatus === "rejected"
      ? initialStatus
      : "pending";

  const [status, setStatus] = useState<ModerationQueueStatus>(safeInitialStatus);
  const [contentType, setContentType] = useState<ContentType | "all">("all");
  const [priority, setPriority] = useState<ModerationPriority | "all">("all");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = {
    status,
    contentType: contentType === "all" ? undefined : contentType,
    priority: priority === "all" ? undefined : priority,
    page,
    limit: LIMIT,
  };

  const { data, isLoading, refetch } = useModerationQueue(queryParams);
  const items = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const emptyText =
    status === "pending"
      ? "Không có nội dung bị gắn cờ nào đang chờ duyệt."
      : `Không tìm thấy bản ghi kiểm duyệt nào có trạng thái "${STATUS_LABELS[status].toLowerCase()}".`;

  const handleStatusChange = (value: ModerationQueueStatus) => {
    setStatus(value);
    setPage(1);
    setSearchParams(value === "pending" ? {} : { status: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="h-8 text-sm font-medium">
            <Link to="/admin/moderation" className="gap-1.5 flex items-center">
              <ArrowLeft className="size-3.5" />
              Bảng điều khiển
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => handleStatusChange(v as ModerationQueueStatus)}
          >
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chờ xem xét</SelectItem>
              <SelectItem value="reviewed">Đã xem xét</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Đã từ chối</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={contentType}
            onValueChange={(v) => {
              setContentType(v as ContentType | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Loại nội dung" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thể loại</SelectItem>
              <SelectItem value="post">Bài viết</SelectItem>
              <SelectItem value="review">Đánh giá</SelectItem>
              <SelectItem value="post_comment">Bình luận bài viết</SelectItem>
              <SelectItem value="livestream_comment">Bình luận Live</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priority}
            onValueChange={(v) => {
              setPriority(v as ModerationPriority | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Mức ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Độ ưu tiên</SelectItem>
              <SelectItem value="HIGH">Cao</SelectItem>
              <SelectItem value="NORMAL">Thường</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => void refetch()} className="h-8 text-sm gap-1.5">
            <RefreshCw className="h-3 w-3" />
            Tải lại
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Đang tải hàng chờ...
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground text-center p-8">
            {emptyText}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-slate-50/50 text-xs uppercase font-bold tracking-wider text-slate-500">
                  <th className="w-10 px-4 py-3" />
                  <th className="w-28 px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="w-32 px-4 py-3">Điểm số</th>
                  <th className="w-48 px-4 py-3">Phát hiện của bộ lọc</th>
                  <th className="w-24 px-4 py-3">Độ ưu tiên</th>
                  <th className="w-28 px-4 py-3">Ngày tạo/Duyệt</th>
                  <th className="w-32 px-4 py-3 text-right pr-6">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <span className="text-xs text-muted-foreground font-semibold">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;
