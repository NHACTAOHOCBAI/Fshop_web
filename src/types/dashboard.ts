export type DashboardOverviewParams = {
  startDate?: string;
  endDate?: string;
};

export type DashboardOverviewResponse = {
  filters: {
    startDate: string;
    endDate: string;
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
  analytics?: {
    conversionFunnel?: Array<{
      stage: string;
      count: number;
      percent: number;
    }>;
    channelRevenue?: Array<{
      channel: string;
      revenue: number;
      percent: number;
    }>;
    customerMix?: {
      newCustomers: number;
      returningCustomers: number;
      newRate: number;
      returningRate: number;
    };
    performanceRates?: {
      cancellationRate: number;
      returnRate: number;
    };
    urgentOrders?: Array<{
      id: number;
      code: string;
      customerName: string;
      status: string;
      waitingMinutes: number;
      priority: 'high' | 'medium' | 'low';
      note?: string;
    }>;
    topProducts?: Array<{
      id: number;
      name: string;
      revenue: number;
      quantity: number;
      percent: number;
    }>;
    topCategories?: Array<{
      id: number;
      name: string;
      revenue: number;
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
