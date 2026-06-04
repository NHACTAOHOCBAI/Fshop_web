import { useShipmentTrackingByOrderId } from "@/hooks/useShipments";
import { formatDateTime } from "@/lib/utils";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Package, 
  Truck, 
  AlertCircle,
  XCircle,
  MapPin,
  Warehouse,
  Bike,
  RotateCcw
} from "lucide-react";

type ShipmentTrackingTimelineProps = {
  orderId: number;
};

type TimelineEvent = {
  status: number;
  statusText: string;
  statusDesc: string;
  updatedAt: string;
  timestamp: number;
};

// Map status codes to modern Lucide icons and colors
const getEventStyles = (status: number) => {
  if (status === 899) {
    return {
      icon: CheckCircle2,
      colorClass: "bg-blue-50 text-blue-600 border-blue-300",
      activeColorClass: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10",
      lineColorClass: "bg-blue-300",
    };
  }
  if (status === 900) {
    return {
      icon: Package,
      colorClass: "bg-slate-100 text-slate-600 border-slate-300",
      activeColorClass: "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10",
      lineColorClass: "bg-slate-300",
    };
  }
  if (status === 901) {
    return {
      icon: Clock,
      colorClass: "bg-amber-50 text-amber-600 border-amber-300",
      activeColorClass: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10",
      lineColorClass: "bg-amber-300",
    };
  }
  if (status === 902) {
    return {
      icon: Truck,
      colorClass: "bg-sky-50 text-sky-600 border-sky-300",
      activeColorClass: "bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/10",
      lineColorClass: "bg-sky-300",
    };
  }
  if (status === 903) {
    return {
      icon: Warehouse,
      colorClass: "bg-indigo-50 text-indigo-600 border-indigo-300",
      activeColorClass: "bg-indigo-500 text-white border-indigo-500 shadow-md border-indigo-500/10",
      lineColorClass: "bg-indigo-300",
    };
  }
  if (status === 904) {
    return {
      icon: Bike,
      colorClass: "bg-violet-50 text-violet-600 border-violet-300",
      activeColorClass: "bg-violet-500 text-white border-violet-500 shadow-md shadow-violet-500/10",
      lineColorClass: "bg-violet-300",
    };
  }
  if (status === 905) {
    return {
      icon: CheckCircle2,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-300",
      activeColorClass: "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10",
      lineColorClass: "bg-emerald-300",
    };
  }
  if ([906, 907, 908, 1000].includes(status)) {
    return {
      icon: AlertCircle,
      colorClass: "bg-rose-50 text-rose-600 border-rose-300",
      activeColorClass: "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10",
      lineColorClass: "bg-rose-300",
    };
  }
  if ([910, 911, 914].includes(status)) {
    return {
      icon: XCircle,
      colorClass: "bg-red-50 text-red-600 border-red-300",
      activeColorClass: "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10",
      lineColorClass: "bg-red-300",
    };
  }
  if ([915, 916, 917].includes(status)) {
    return {
      icon: RotateCcw,
      colorClass: "bg-orange-50 text-orange-600 border-orange-300",
      activeColorClass: "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10",
      lineColorClass: "bg-orange-300",
    };
  }
  return {
    icon: Circle,
    colorClass: "bg-slate-50 text-slate-500 border-slate-200",
    activeColorClass: "bg-slate-500 text-white border-slate-500 shadow-md shadow-slate-500/10",
    lineColorClass: "bg-slate-200",
  };
};

const ShipmentTrackingTimeline = ({ orderId }: ShipmentTrackingTimelineProps) => {
  const { data, isLoading, isError } = useShipmentTrackingByOrderId(orderId);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="space-y-3 pl-2 border-l border-slate-200">
          <div className="flex gap-3">
            <div className="-ml-4 size-3 rounded-full bg-slate-300" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-1/4 bg-slate-200 rounded" />
              <div className="h-3.5 w-1/2 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="-ml-4 size-3 rounded-full bg-slate-300" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-1/4 bg-slate-200 rounded" />
              <div className="h-3.5 w-1/2 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return null; // Return empty space gracefully
  }

  const shipment = data.data.shipment;
  const providerData = data.data.providerData as any;

  // Extract history records from both API (Goship Sandbox) and DB (Local simulates)
  const localHistory: TimelineEvent[] = (shipment?.shipmentMeta?.history || []).map((item: any) => ({
    status: Number(item.status),
    statusText: item.status_text || "",
    statusDesc: item.status_desc || "",
    updatedAt: item.updated_at,
    timestamp: new Date(item.updated_at).getTime(),
  }));

  const goshipHistory: TimelineEvent[] = (providerData?.data?.[0]?.history || []).map((item: any) => {
    const time = item.updated_time ? item.updated_time * 1000 : new Date(item.updated_at).getTime();
    return {
      status: Number(item.status),
      statusText: item.status_text || "",
      statusDesc: item.status_desc || "",
      updatedAt: new Date(time).toISOString(),
      timestamp: time,
    };
  });

  const orderCreatedAt = shipment?.order?.createdAt || shipment?.createdAt;
  // Combine and sort descending (newest updates first)
  const combined = [...localHistory, ...goshipHistory];
  combined.forEach(event => {
    if (event.status === 900) {
      event.statusText = "Chưa xác nhận";
      event.statusDesc = "Đơn hàng đã tiếp nhận và đang chờ cửa hàng xác nhận.";
      if (orderCreatedAt) {
        event.updatedAt = orderCreatedAt;
        event.timestamp = new Date(orderCreatedAt).getTime();
      }
    }
  });
  combined.sort((a, b) => b.timestamp - a.timestamp);

  // Deduplicate by status code to avoid double entries
  const events: TimelineEvent[] = [];
  const seenCodes = new Set<number>();
  for (const event of combined) {
    if (!seenCodes.has(event.status)) {
      seenCodes.add(event.status);
      events.push(event);
    }
  }

  // Self-healing: Inject delivery failed / canceled if the order is in that state but not present in events
  if ((shipment as any)?.order?.status === "delivery_failed" && !seenCodes.has(906)) {
    events.push({
      status: 906,
      statusText: "Giao hàng thất bại",
      statusDesc: (shipment as any).shipmentMeta?.cancelReason || "Khách không nhận hoặc không liên hệ được.",
      updatedAt: shipment.updatedAt || shipment.createdAt,
      timestamp: new Date(shipment.updatedAt || shipment.createdAt).getTime(),
    });
    seenCodes.add(906);
  }

  if ((shipment as any)?.order?.status === "canceled" && !seenCodes.has(910)) {
    events.push({
      status: 910,
      statusText: "Đã hủy đơn",
      statusDesc: (shipment as any).shipmentMeta?.cancelReason || "Hành trình vận chuyển bị huỷ.",
      updatedAt: shipment.updatedAt || shipment.createdAt,
      timestamp: new Date(shipment.updatedAt || shipment.createdAt).getTime(),
    });
    seenCodes.add(910);
  }

  // 1. Ensure "Chờ lấy hàng" (901) is present if shipment exists and order status has progressed beyond confirmed/canceled
  const hasProgressedBeyondConfirmed = shipment?.order?.status && !["pending", "confirmed", "canceled"].includes(shipment.order.status);
  if (shipment && hasProgressedBeyondConfirmed && !seenCodes.has(901)) {
    events.push({
      status: 901,
      statusText: "Chờ lấy hàng",
      statusDesc: "Đơn hàng đã được tạo mã vận đơn và chờ shipper tới lấy.",
      updatedAt: shipment.createdAt,
      timestamp: new Date(shipment.createdAt).getTime() + 2000,
    });
    seenCodes.add(901);
  }

  // 1.5. Ensure "Đã xác nhận" (899) is present if shipment exists (meaning order is confirmed or later)
  if (shipment && !seenCodes.has(899)) {
    events.push({
      status: 899,
      statusText: "Đã xác nhận",
      statusDesc: "Đơn hàng đã được xác nhận thành công.",
      updatedAt: shipment.createdAt,
      timestamp: new Date(shipment.createdAt).getTime() + 1000,
    });
    seenCodes.add(899);
  }

  // 2. Ensure "Chưa xác nhận" (900) is always present as the starting event
  if (shipment && !seenCodes.has(900)) {
    const orderCreatedAt = (shipment as any).order?.createdAt || shipment.createdAt;
    events.push({
      status: 900,
      statusText: "Chưa xác nhận",
      statusDesc: "Đơn hàng đã tiếp nhận và đang chờ cửa hàng xác nhận.",
      updatedAt: orderCreatedAt,
      timestamp: new Date(orderCreatedAt).getTime(),
    });
    seenCodes.add(900);
  }

  // Sort again to ensure perfect chronological order after injections
  events.sort((a, b) => b.timestamp - a.timestamp);

  // Fallback: If no history records exist, construct one step from local shipment columns
  if (events.length === 0 && shipment) {
    const statusText = shipment.shipmentStatus || "Đơn hàng đã tiếp nhận";
    const statusCode = shipment.shipmentStatusCode || 900;
    events.push({
      status: statusCode,
      statusText: statusCode === 900 ? "Chưa xác nhận" : statusText,
      statusDesc: statusCode === 900 ? "Đơn hàng đã tiếp nhận và đang chờ cửa hàng xác nhận." : "Đang được xử lý trên hệ thống.",
      updatedAt: shipment.updatedAt || shipment.createdAt,
      timestamp: new Date(shipment.updatedAt || shipment.createdAt).getTime(),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <MapPin className="size-4 text-slate-500" />
          Hành trình đơn hàng
        </h3>
        {shipment && (
          <span className="text-[11px] font-mono bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
            Mã vận đơn: {(!shipment.trackingCode || shipment.trackingCode.toLowerCase() === "null") ? shipment.shipmentId : shipment.trackingCode}
          </span>
        )}
      </div>

      <div className="relative ml-3.5 pl-6 border-l border-slate-200 space-y-6">
        {events.map((event, index) => {
          const isLatest = index === 0;
          const styles = getEventStyles(event.status);
          const EventIcon = styles.icon;

          return (
            <div key={`${event.status}-${index}`} className="relative">
              {/* Event Dot */}
              <span
                className={`absolute -left-9.5 top-0.5 inline-flex size-7 items-center justify-center rounded-full border-2 transition-all ${
                  isLatest ? styles.activeColorClass : `${styles.colorClass} border-white`
                }`}
              >
                <EventIcon className="size-3.5" />
              </span>

              {/* Event Content */}
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span
                    className={`text-sm font-bold leading-none ${
                      isLatest ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {event.statusText}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDateTime(event.updatedAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {event.statusDesc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShipmentTrackingTimeline;
