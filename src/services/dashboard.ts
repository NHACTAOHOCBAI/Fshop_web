import axiosInstance from '@/lib/axios';
import type { DashboardOverviewParams, DashboardOverviewResponse } from '@/types/dashboard';
import type { ApiResponse } from '@/types/response';

export const getDashboardOverview = async (params?: DashboardOverviewParams) => {
  const { data } = await axiosInstance.get<ApiResponse<DashboardOverviewResponse>>('/dashboard/overview', {
    params,
  });

  return data;
};
