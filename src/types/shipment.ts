export type Shipment = {
  id: number;
  shipmentProvider: string;
  shipmentId?: string | null;
  trackingCode?: string | null;
  trackingUrl?: string | null;
  carrierName?: string | null;
  shippingService?: string | null;
  shippingFee?: number | string | null;
  shipmentStatus?: string | null;
  shipmentStatusCode?: number | null;
  shipmentMeta?: {
    history?: Array<{
      status: number;
      status_text: string;
      status_desc: string;
      updated_at: string;
    }>;
    cancelReason?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  order?: any;
};

export type GoshipRateOption = {
  id: string;
  carrier_name: string;
  carrier_logo?: string | null;
  service: string;
  expected?: string | null;
  cod_fee?: number | string | null;
  total_fee?: number | string | null;
  total_amount?: number | string | null;
};

export type ShipmentTrackingResponse = {
  shipment: Shipment;
  providerData: unknown;
};

export type GoshipRatePreviewResponse = GoshipRateOption[];
