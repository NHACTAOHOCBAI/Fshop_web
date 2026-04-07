import { useQuery } from '@tanstack/react-query';

import { getDashboardOverview } from '@/services/dashboard';
import type { DashboardOverviewParams } from '@/types/dashboard';

export const useDashboardOverview = (params?: DashboardOverviewParams) => {
  return useQuery({
    queryKey: ['dashboard', 'overview', params],
    queryFn: () => getDashboardOverview(params),
  });
};
