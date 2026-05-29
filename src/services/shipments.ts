import axiosInstance from "@/lib/axios";
import type { ApiResponse } from "@/types/response";
import type {
  GoshipRatePreviewResponse,
  Shipment,
  ShipmentTrackingResponse,
} from "@/types/shipment";

export const getShipmentByOrderId = async (orderId: number) => {
  const { data } = await axiosInstance.get<ApiResponse<Shipment>>(
    `/shipments/order/${orderId}`,
  );
  return data;
};

export const getShipmentTrackingByOrderId = async (orderId: number) => {
  const { data } = await axiosInstance.get<
    ApiResponse<ShipmentTrackingResponse>
  >(`/shipments/order/${orderId}/tracking`);
  return data;
};

export const getGoshipRatesPreview = async (payload: {
  addressTo: { city: string; district: string; ward: string };
  cod?: number;
  amount?: number;
}) => {
  const { data } = await axiosInstance.post<
    ApiResponse<GoshipRatePreviewResponse>
  >("/shipments/rates/preview", payload);
  return data;
};
