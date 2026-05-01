import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModerationQueue, useOverrideDecision } from "@/hooks/useModeration";
import type { ContentType, ModerationLog, ModerationPriority } from "@/types/moderation";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  review: "Review",
  post_comment: "Post Comment",
  livestream_comment: "Livestream",
};

const LABEL_COLORS: Record<string, string> = {
  toxic: "bg-red-100 text-red-800",
  spam: "bg-yellow-100 text-yellow-800",
  hate_speech: "bg-purple-100 text-purple-800",
  nsfw: "bg-pink-100 text-pink-800",
  off_topic: "bg-gray-100 text-gray-800",
};

const ScoreBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
      <div
        className="h-full rounded-full bg-red-500 transition-all"
        style={{ width: `${Math.round(score * 100)}%` }}
      />
    </div>
    <span className="text-xs tabular-nums text-muted-foreground">
      {(score * 100).toFixed(0)}%
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
      { onSuccess: () => toast.success("Content approved") }
    );
  };

  const handleReject = () => {
    override(
      { logId: log.id, decision: "rejected" },
      { onSuccess: () => toast.success("Content rejected") }
    );
  };

  return (
    <>
      <tr
        className="cursor-pointer border-b hover:bg-muted/50"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-4 py-3">
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
            {CONTENT_TYPE_LABELS[log.contentType]}
          </span>
        </td>
        <td className="max-w-xs px-4 py-3">
          <p className="line-clamp-2 text-sm">{log.contentText}</p>
        </td>
        <td className="px-4 py-3">
          <ScoreBar score={log.finalScore} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {topLabels.map(([label]) => (
              <span
                key={label}
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${LABEL_COLORS[label] ?? "bg-gray-100 text-gray-700"}`}
              >
                {label}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          {log.priority === "HIGH" ? (
            <Badge variant="destructive">HIGH</Badge>
          ) : (
            <Badge variant="outline">NORMAL</Badge>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {new Date(log.createdAt).toLocaleDateString("vi-VN")}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              onClick={handleApprove}
              disabled={isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={handleReject}
              disabled={isPending}
            >
              Reject
            </Button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/30">
          <td colSpan={8} className="px-8 py-4">
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Full Content
                </p>
                <p className="rounded border bg-white p-3 text-sm">{log.contentText}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-muted-foreground">Rule Score</p>
                  <ScoreBar score={log.ruleScore} />
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">ML Score</p>
                  <ScoreBar score={log.mlScore} />
                </div>
              </div>
              {Object.keys(log.mlLabels ?? {}).length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    All ML Scores
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(log.mlLabels).map(([label, score]) => (
                      <div key={label} className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{label}</span>
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
  const [contentType, setContentType] = useState<ContentType | "all">("all");
  const [priority, setPriority] = useState<ModerationPriority | "all">("all");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = {
    contentType: contentType === "all" ? undefined : contentType,
    priority: priority === "all" ? undefined : priority,
    page,
    limit: LIMIT,
  };

  const { data, isLoading, refetch } = useModerationQueue(queryParams);
  const items = data?.data?.items ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moderation Queue</h1>
        <div className="flex items-center gap-3">
          <Select
            value={contentType}
            onValueChange={(v) => {
              setContentType(v as ContentType | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="post_comment">Post Comment</SelectItem>
              <SelectItem value="livestream_comment">Livestream</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priority}
            onValueChange={(v) => {
              setPriority(v as ModerationPriority | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priority</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No flagged content pending review.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Content</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Labels</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;
