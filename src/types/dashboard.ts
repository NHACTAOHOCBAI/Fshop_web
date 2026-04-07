export type DashboardTimeRange = '7d' | '30d' | 'quarter';

export type DashboardOverviewParams = {
  timeRange?: DashboardTimeRange;
};

export type DashboardOverviewResponse = {
  filters: {
    timeRange: DashboardTimeRange;
  };
  metrics: {
    revenue: {
      value: number;
      previousValue: number;
      changePercent: number;
    };
    orders: {
      value: number;
      previousValue: number;
      changePercent: number;
    };
    newUsers: {
      value: number;
      previousValue: number;
      changePercent: number;
    };
    lowStock: {
      value: number;
      threshold: number;
    };
  };
  charts: {
    revenueSeries: Array<{
      label: string;
      revenue: number;
    }>;
    categoryShare: Array<{
      label: string;
      value: number;
    }>;
    orderStatusSeries: Array<{
      status: string;
      label: string;
      count: number;
      percent: number;
    }>;
  };
  recentActivities: Array<{
    type: 'order' | 'user' | 'inventory';
    title: string;
    description: string;
    time: string;
  }>;
  generatedAt: string;
};
