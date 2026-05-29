import { useQuery } from "@tanstack/react-query";
import { authStorage } from "@/lib/auth";
import {
  getGoshipRatesPreview,
  getShipmentByOrderId,
  getShipmentTrackingByOrderId,
} from "@/services/shipments";

export const useShipmentByOrderId = (orderId: number, enabled = true) => {
  return useQuery({
    queryKey: ["shipments", "order", orderId],
    queryFn: () => getShipmentByOrderId(orderId),
    enabled:
      enabled &&
      Number.isFinite(orderId) &&
      orderId > 0 &&
      Boolean(authStorage.getAccessToken()),
  });
};

export const useShipmentTrackingByOrderId = (
  orderId: number,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["shipments", "tracking", orderId],
    queryFn: () => getShipmentTrackingByOrderId(orderId),
    enabled:
      enabled &&
      Number.isFinite(orderId) &&
      orderId > 0 &&
      Boolean(authStorage.getAccessToken()),
  });
};

export const useGoshipRatesPreview = (
  payload: {
    addressTo: { city: string; district: string; ward: string };
    cod?: number;
    amount?: number;
  } | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["shipments", "rates", payload],
    queryFn: () =>
      getGoshipRatesPreview(
        payload as {
          addressTo: { city: string; district: string; ward: string };
          cod?: number;
          amount?: number;
        },
      ),
    enabled:
      enabled && Boolean(payload) && Boolean(authStorage.getAccessToken()),
  });
};
