import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Truck, HelpCircle, Settings, Search, Package } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import ShipmentTrackingTimeline from "@/components/orders/ShipmentTrackingTimeline";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrderById, useAllOrders } from "@/hooks/useOrders";
import { useShipmentByOrderId, useUpdateShipmentStatus } from "@/hooks/useShipments";
import { formatDateTime } from "@/lib/utils";

const SHIPMENT_STATUS_OPTIONS = [
    { code: 901, text: "Chờ lấy hàng", desc: "ĐVVC tiếp nhận yêu cầu lấy hàng" },
    { code: 902, text: "Đang vận chuyển", desc: "Đơn hàng đang trung chuyển qua bưu cục" },
    { code: 904, text: "Đang giao hàng", desc: "Shipper đang đi phát hàng" },
    { code: 905, text: "Giao thành công", desc: "Người nhận đã ký tên nhận hàng" },
    { code: 906, text: "Giao thất bại", desc: "Không liên lạc được hoặc khách từ chối nhận" },
    { code: 910, text: "Đã hủy đơn", desc: "Vận đơn bị hủy trên hệ thống" },
];

const ShipmentSimulationPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryOrderId = searchParams.get("orderId");

    const [inputOrderId, setInputOrderId] = useState<string>(queryOrderId || "");
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
        queryOrderId ? Number(queryOrderId) : null
    );

    // List of recent orders for quick selection
    const { data: recentOrdersData, isLoading: isRecentLoading } = useAllOrders({
        limit: 10,
        sortBy: "id",
        sortOrder: "DESC",
    });

    const activeOrderId = selectedOrderId || 0;

    const { data: orderData, isLoading: isOrderLoading, isError: isOrderError, error: orderError } = useOrderById(
        activeOrderId, 
        activeOrderId > 0
    );
    
    const order = orderData?.data;

    // Call shipments API only if order is loaded and is not pending
    const shipmentQuery = useShipmentByOrderId(
        activeOrderId, 
        activeOrderId > 0 && Boolean(order) && order?.status !== "pending"
    );
    
    const { mutate: updateShipmentStatus, isPending: isUpdatingShipment } = useUpdateShipmentStatus();

    const [selectedStatusCode, setSelectedStatusCode] = useState<number>(901);
    
    // Dynamic Input States
    const [customTrackingCode, setCustomTrackingCode] = useState<string>("");
    const [carrierName, setCarrierName] = useState<string>("");
    const [trackingUrl, setTrackingUrl] = useState<string>("");
    const [currentLocation, setCurrentLocation] = useState<string>("");
    const [shipperName, setShipperName] = useState<string>("");
    const [shipperPhone, setShipperPhone] = useState<string>("");
    const [receivedBy, setReceivedBy] = useState<string>("");
    const [cancelReason, setCancelReason] = useState<string>("");

    const shipment = shipmentQuery.data?.data;

    // Sync state when query parameter changes
    useEffect(() => {
        if (queryOrderId) {
            setInputOrderId(queryOrderId);
            setSelectedOrderId(Number(queryOrderId));
        } else {
            setInputOrderId("");
            setSelectedOrderId(null);
        }
    }, [queryOrderId]);

    // Premium UX: Pre-populate tracking fields from active shipment if available
    useEffect(() => {
        if (shipment) {
            setCustomTrackingCode(shipment.trackingCode || "");
            setCarrierName(shipment.carrierName || shipment.shipmentProvider || "");
            setTrackingUrl(shipment.trackingUrl || "");
        } else {
            setCustomTrackingCode("");
            setCarrierName("");
            setTrackingUrl("");
        }
        
        // Reset location, shipper, receivedBy, and cancelReason when shipment or order changes
        setCurrentLocation("");
        setShipperName("");
        setShipperPhone("");
        setReceivedBy("");
        setCancelReason("");
    }, [shipment]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = Number(inputOrderId.trim());
        if (Number.isInteger(parsed) && parsed > 0) {
            setSelectedOrderId(parsed);
            setSearchParams({ orderId: String(parsed) });
        } else {
            toast.error("Vui lòng nhập Mã đơn hàng (ID) hợp lệ");
        }
    };

    const handleSelectRecentOrder = (id: number) => {
        setInputOrderId(String(id));
        setSelectedOrderId(id);
        setSearchParams({ orderId: String(id) });
    };

    const handleClearSelected = () => {
        setSelectedOrderId(null);
        setInputOrderId("");
        setSearchParams({});
    };

    const currentOption = SHIPMENT_STATUS_OPTIONS.find(opt => opt.code === selectedStatusCode);

    const handleMockUpdate = () => {
        if (!currentOption || !activeOrderId) return;

        // Frontend validations
        if (selectedStatusCode === 901 && !customTrackingCode.trim()) {
            toast.error("Vui lòng nhập Mã vận đơn giả lập cho mốc Chờ lấy hàng");
            return;
        }

        if (selectedStatusCode === 910 && !cancelReason.trim()) {
            toast.error("Vui lòng nhập Lý do hủy bưu phẩm");
            return;
        }

        updateShipmentStatus(
            {
                orderId: activeOrderId,
                payload: {
                    statusCode: selectedStatusCode,
                    statusText: currentOption.text,
                    trackingCode: customTrackingCode || undefined,
                    carrierName: selectedStatusCode === 901 ? (order?.shippingCarrierName || carrierName) : undefined, // Automatically use carrier from order
                    trackingUrl: trackingUrl || undefined,
                    currentLocation: currentLocation || undefined,
                    shipperName: shipperName || undefined,
                    shipperPhone: shipperPhone || undefined,
                    receivedBy: receivedBy || undefined,
                    cancelReason: cancelReason || undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success(`Đã gửi giả lập webhook mốc "${currentOption.text}" thành công!`);
                    shipmentQuery.refetch();
                },
                onError: (err: any) => {
                    toast.error(err.message || "Không thể gửi giả lập.");
                },
            }
        );
    };

    return (
        <div className="w-full space-y-5">
            {/* Top Navigation */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/orders" className="gap-1.5">
                        <ArrowLeft className="size-4" />
                        Quay lại danh sách đơn
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                        <Settings className="size-3.5" /> Sandbox Central Panel
                    </span>
                </div>
            </div>

            {/* Header section */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 backdrop-blur md:p-6">
                <div className="flex items-center gap-3">
                    <Truck className="size-8 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Bảng điều khiển Giả lập Vận chuyển (Sandbox Webhook)</h1>
                        <p className="text-xs text-slate-500">Giả lập gửi tín hiệu Webhook từ GOSHIP Sandbox để thay đổi trạng thái đơn hàng FShop.</p>
                    </div>
                </div>
            </section>

            {/* If no order is selected: Show Search & Selection Screen */}
            {!selectedOrderId ? (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Search Panel */}
                    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800">1. Nhập mã đơn hàng cần giả lập</h3>
                        <form onSubmit={handleSearchSubmit} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Nhập ID đơn hàng (Ví dụ: 12)"
                                    value={inputOrderId}
                                    onChange={(e) => setInputOrderId(e.target.value)}
                                    className="pl-9 h-11"
                                />
                            </div>
                            <Button type="submit" className="h-11 px-6">
                                Bắt đầu
                            </Button>
                        </form>
                        <p className="text-xs text-slate-400">
                            Hệ thống sẽ kiểm tra xem đơn hàng đã được Confirm để sinh mã vận đơn Goship tương ứng chưa.
                        </p>
                    </div>

                    {/* Recent list panel */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800">Gợi ý đơn hàng gần đây</h3>
                        {isRecentLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="size-5 animate-spin text-slate-400" />
                            </div>
                        ) : (recentOrdersData?.data ?? []).length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-4">Chưa có đơn hàng nào.</p>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {(recentOrdersData?.data ?? []).slice(0, 5).map((ord) => (
                                    <button
                                        key={ord.id}
                                        type="button"
                                        onClick={() => handleSelectRecentOrder(ord.id)}
                                        className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-primary/20 hover:bg-slate-50/50 text-left text-xs transition-all"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Package className="size-3.5 text-slate-400" />
                                            <span className="font-semibold text-slate-800">Đơn #{ord.id}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400">{formatDateTime(ord.createdAt)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Selected Order Details and Simulation form */
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={handleClearSelected} className="gap-1.5">
                            <ArrowLeft className="size-3.5" /> Chọn đơn hàng khác
                        </Button>
                        <span className="text-xs text-slate-500">Đang giả lập cho đơn hàng: <strong className="text-slate-800">#{activeOrderId}</strong></span>
                    </div>

                    {isOrderLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            <Loader2 className="mx-auto mb-2 size-5 animate-spin text-slate-400" />
                            Đang tải chi tiết đơn hàng...
                        </div>
                    ) : isOrderError || !order ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                            Không thể tìm thấy hoặc tải đơn hàng #{activeOrderId}: {orderError?.message || "Lỗi không xác định."}
                        </div>
                    ) : order.status === "pending" ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700 space-y-2">
                            <h3 className="font-bold text-base">Đơn hàng #{order.id} đang ở trạng thái Chờ xác nhận!</h3>
                            <p>Đơn hàng này chưa được xác nhận nên chưa thể tạo hoặc giả lập vận đơn GOSHIP.</p>
                            <p className="text-xs text-amber-600">Hãy nhấn <strong>Xác nhận đơn hàng (Confirm)</strong> ở trang quản lý đơn để xác nhận trước khi tiến hành giả lập.</p>
                            <div className="pt-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link to={`/admin/orders/${order.id}`}>Quay lại trang quản lý đơn</Link>
                                </Button>
                            </div>
                        </div>
                    ) : !shipment ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700 space-y-2">
                            <h3 className="font-bold text-base">Đơn hàng #{order.id} chưa tạo vận đơn GOSHIP!</h3>
                            <p>Đơn hàng này đang ở trạng thái <strong>"{order.status}"</strong> và chưa được đẩy liên kết sang GOSHIP.</p>
                            <p className="text-xs text-amber-600">Hãy nhấn <strong>Xác nhận đơn hàng (Confirm)</strong> ở trang quản lý đơn để sinh vận đơn trước khi tiến hành giả lập.</p>
                            <div className="pt-2">
                                <Button asChild variant="outline" size="sm">
                                    <Link to={`/admin/orders/${order.id}`}>Quay lại trang quản lý đơn</Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Simulation Form Card */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                                <div className="flex items-start gap-2 border-b border-slate-100 pb-3">
                                    <HelpCircle className="size-5 text-sky-600 mt-0.5 shrink-0" />
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Bảng điều khiển Giả lập Webhook</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Chọn mốc trạng thái bưu tá để gửi webhook giả lập từ GOSHIP Sandbox về hệ thống. Các trường thông tin động sẽ tự động ẩn/hiện theo mốc bạn chọn.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="mock-status" className="text-xs font-semibold text-slate-700">Mốc trạng thái vận chuyển</Label>
                                    <Select
                                        value={String(selectedStatusCode)}
                                        onValueChange={(val) => setSelectedStatusCode(Number(val))}
                                    >
                                        <SelectTrigger id="mock-status" className="bg-white">
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SHIPMENT_STATUS_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.code} value={String(opt.code)}>
                                                    {opt.text} ({opt.code}) - {opt.desc}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Conditional dynamic input fields based on status code */}
                                {selectedStatusCode === 901 && (
                                    <div className="space-y-4 border-t border-slate-100 pt-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="mock-tracking" className="text-xs font-semibold text-slate-700">
                                                Mã vận đơn giả lập (Tracking Code) <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="mock-tracking"
                                                type="text"
                                                placeholder="Ví dụ: GHTK_TEST_123456789"
                                                value={customTrackingCode}
                                                onChange={(e) => setCustomTrackingCode(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="mock-tracking-url" className="text-xs font-semibold text-slate-700">
                                                Đường dẫn tra cứu giả lập (Tracking URL)
                                            </Label>
                                            <Input
                                                id="mock-tracking-url"
                                                type="text"
                                                placeholder="Ví dụ: https://donhang.ghn.vn/?order_code=..."
                                                value={trackingUrl}
                                                onChange={(e) => setTrackingUrl(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedStatusCode === 902 && (
                                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                        <Label htmlFor="mock-location" className="text-xs font-semibold text-slate-700">
                                            Vị trí bưu cục trung chuyển hiện tại (Current Location)
                                        </Label>
                                        <Input
                                            id="mock-location"
                                            type="text"
                                            placeholder="Ví dụ: Kho Hà Nội SOC, Bưu cục Quận Cầu Giấy"
                                            value={currentLocation}
                                            onChange={(e) => setCurrentLocation(e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                )}

                                {selectedStatusCode === 904 && (
                                    <div className="space-y-4 border-t border-slate-100 pt-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="mock-shipper-name" className="text-xs font-semibold text-slate-700">
                                                Tên shipper/bưu tá đi giao hàng (Shipper Name)
                                            </Label>
                                            <Input
                                                id="mock-shipper-name"
                                                type="text"
                                                placeholder="Ví dụ: Nguyễn Văn Hùng"
                                                value={shipperName}
                                                onChange={(e) => setShipperName(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="mock-shipper-phone" className="text-xs font-semibold text-slate-700">
                                                SĐT shipper/bưu tá (Shipper Phone)
                                            </Label>
                                            <Input
                                                id="mock-shipper-phone"
                                                type="text"
                                                placeholder="Ví dụ: 0966777888"
                                                value={shipperPhone}
                                                onChange={(e) => setShipperPhone(e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedStatusCode === 905 && (
                                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                        <Label htmlFor="mock-received-by" className="text-xs font-semibold text-slate-700">
                                            Tên người ký nhận bưu phẩm (Received By)
                                        </Label>
                                        <Input
                                            id="mock-received-by"
                                            type="text"
                                            placeholder="Ví dụ: Chính chủ nhận, Bảo vệ nhận hộ, Anh Tuấn (đồng nghiệp)"
                                            value={receivedBy}
                                            onChange={(e) => setReceivedBy(e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                )}

                                {(selectedStatusCode === 910 || selectedStatusCode === 906) && (
                                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                                        <Label htmlFor="mock-cancel-reason" className="text-xs font-semibold text-slate-700">
                                            Lý do sự cố/hủy bưu phẩm (Reason) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="mock-cancel-reason"
                                            type="text"
                                            placeholder="Ví dụ: Khách từ chối nhận hàng, Không liên lạc được người nhận sau 3 lần gọi"
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            className="bg-white"
                                        />
                                    </div>
                                )}

                                <Button
                                    className="w-full font-bold gap-1.5 mt-2"
                                    onClick={handleMockUpdate}
                                    disabled={isUpdatingShipment}
                                >
                                    {isUpdatingShipment ? "Đang cập nhật..." : "Kích hoạt gửi giả lập webhook"}
                                </Button>
                            </div>

                            {/* Shipment Preview Card */}
                            <div className="space-y-5">
                                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Thông tin vận đơn hiện hành</h3>
                                    <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                        <p>Đơn vị vận chuyển: <span className="font-semibold text-slate-800">{shipment.carrierName || shipment.shipmentProvider || "-"}</span></p>
                                        <p>Mã bưu phẩm Goship: <span className="font-mono font-medium text-slate-800">{shipment.shipmentId || "-"}</span></p>
                                        <p>Mã vận đơn hiện tại: <span className="font-mono font-medium text-slate-800">{(!shipment.trackingCode || shipment.trackingCode.toLowerCase() === "null") ? shipment.shipmentId : shipment.trackingCode}</span></p>
                                        <p>Trạng thái cuối nhận: <span className="font-semibold text-sky-700">{shipment.shipmentStatus || "Chưa có"}</span></p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 p-5 bg-white">
                                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">Xem nhanh timeline hành trình đơn hàng</h3>
                                    <ShipmentTrackingTimeline orderId={activeOrderId} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShipmentSimulationPage;
