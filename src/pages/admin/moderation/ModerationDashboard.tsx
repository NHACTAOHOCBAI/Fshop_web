import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  toxic: "Toxic",
  spam: "Spam",
  hate_speech: "Hate Speech",
  nsfw: "NSFW",
  off_topic: "Off-topic",
};

const CONTENT_TYPE_LABELS: Record<ModerationLog["contentType"], string> = {
  post: "Post",
  review: "Review",
  post_comment: "Comment",
  livestream_comment: "Live comment",
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

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: typeof ShieldAlert;
  color: string;
}) => (
  <Card>
    <CardContent className="flex items-center gap-4 pt-6">
      <div className={`rounded-full p-3 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

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
  <Card>
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      <div>
        <CardTitle>{title}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button asChild variant="outline" size="sm">
          <Link to={action.to}>
            {action.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-24 text-right">Score</TableHead>
              <TableHead className="w-24">Priority</TableHead>
              <TableHead className="w-28 text-right">{timeLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="secondary">
                    {CONTENT_TYPE_LABELS[item.contentType]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="line-clamp-2 max-w-xl text-sm">
                    {item.contentText}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ID #{item.contentId}
                  </p>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatPercent(item.finalScore)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={item.priority === "HIGH" ? "destructive" : "outline"}
                  >
                    {item.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatDateTime(getTime(item))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
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
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moderation Dashboard</h1>
        <Link
          to="/admin/moderation/queue"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Review Queue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Flagged"
          value={statsData?.totalFlagged ?? 0}
          icon={ShieldAlert}
          color="bg-red-500"
        />
        <StatCard
          title="Pending Review"
          value={statsData?.pendingReview ?? 0}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="High Priority"
          value={statsData?.highPriority ?? 0}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
        <StatCard
          title="Rejected"
          value={statsData?.rejected ?? 0}
          icon={XCircle}
          color="bg-slate-700"
        />
        <StatCard
          title="Auto-Approved Rate"
          value={`${statsData?.autoApprovedRate ?? 0}%`}
          icon={CheckCircle2}
          color="bg-green-500"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ModerationItemsTable
          title="Recently Flagged"
          description="Latest content waiting for admin review."
          items={recentData?.flagged ?? []}
          isLoading={isRecentLoading}
          emptyText="No flagged content is waiting for review."
          timeLabel="Flagged At"
          getTime={(item) => item.createdAt}
          action={{
            label: "Open Queue",
            to: "/admin/moderation/queue?status=pending",
          }}
        />
        <ModerationItemsTable
          title="Rejected by Admin"
          description="Content that was reviewed and rejected."
          items={recentData?.rejected ?? []}
          isLoading={isRecentLoading}
          emptyText="No rejected content has been recorded yet."
          timeLabel="Reviewed At"
          getTime={(item) => item.reviewedAt ?? item.createdAt}
          action={{
            label: "View Rejected",
            to: "/admin/moderation/queue?status=rejected",
          }}
        />
      </div>

      {labelChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Label Distribution (last 500 flagged)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const max = Math.max(...labelChartData.map((d) => d.count), 1);
                return labelChartData.map((d) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-muted-foreground">
                      {d.label}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted h-4">
                      <div
                        className="h-full rounded-full bg-red-500 transition-all"
                        style={{ width: `${(d.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium tabular-nums">
                      {d.count}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModerationDashboard;
