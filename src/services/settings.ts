import axiosInstance from '@/lib/axios';
import type { ApiResponse } from '@/types/response';

export type SystemSetting = {
  key: string;
  value: string;
  description?: string;
};

export const getSystemSettings = async () => {
  const { data } = await axiosInstance.get<ApiResponse<SystemSetting[]>>('/settings');
  return data;
};

export const updateSystemSettings = async (settings: Array<{ key: string; value: string }>) => {
  const { data } = await axiosInstance.patch<ApiResponse<SystemSetting[]>>('/settings', settings);
  return data;
};
