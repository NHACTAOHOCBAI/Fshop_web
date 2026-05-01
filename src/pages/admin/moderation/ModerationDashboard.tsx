import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useModerationStats } from "@/hooks/useModeration";

const LABEL_DISPLAY: Record<string, string> = {
  toxic: "Toxic",
  spam: "Spam",
  hate_speech: "Hate Speech",
  nsfw: "NSFW",
  off_topic: "Off-topic",
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

const ModerationDashboard = () => {
  const { data: stats, isLoading } = useModerationStats();

  const statsData = stats?.data;
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          title="Auto-Approved Rate"
          value={`${statsData?.autoApprovedRate ?? 0}%`}
          icon={CheckCircle2}
          color="bg-green-500"
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
