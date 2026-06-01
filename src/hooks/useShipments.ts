import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authStorage } from "@/lib/auth";
import {
  getGoshipRatesPreview,
  getShipmentByOrderId,
  getShipmentTrackingByOrderId,
  updateShipmentStatus,
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

export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: number;
      payload: {
        statusCode: number;
        statusText: string;
        trackingCode?: string;
        carrierName?: string;
        trackingUrl?: string;
        currentLocation?: string;
        shipperName?: string;
        shipperPhone?: string;
        receivedBy?: string;
        cancelReason?: string;
      };
    }) => updateShipmentStatus(orderId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipments", "tracking", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["shipments", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders", variables.orderId] });
    },
  });
};
