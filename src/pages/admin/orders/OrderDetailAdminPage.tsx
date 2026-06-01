import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Truck, Settings } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import ShipmentTrackingTimeline from "@/components/orders/ShipmentTrackingTimeline";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_STATUS_LABEL, getAdminAllowedNextStatuses } from "@/constants/orderStatus";
import { useOrderById, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useShipmentByOrderId } from "@/hooks/useShipments";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { AddressDisplay } from "@/components/address/AddressDisplay";
import type { OrderStatus } from "@/types/order";

const OrderDetailAdminPage = () => {
    const params = useParams<{ orderId?: string }>();
    const orderId = Number(params.orderId);
    const { data, isLoading, isError, error, refetch: refetchOrder } = useOrderById(orderId, Number.isFinite(orderId));
    const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus();
    
    const order = data?.data;
    
    // Call shipments API only if order is not pending
    const shipmentQuery = useShipmentByOrderId(
        orderId, 
        Number.isFinite(orderId) && Boolean(order) && order.status !== "pending"
    );

    // Form states for manual order status change (stateless by default to let it fall back to order.status)
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");
    const [updateReason, setUpdateReason] = useState<string>("");
    
    // GOSHIP shipment details for manual sync
    const [customTrackingCode, setCustomTrackingCode] = useState<string>("");
    const [carrierName, setCarrierName] = useState<string>("");
    const [trackingUrl, setTrackingUrl] = useState<string>("");
    const [currentLocation, setCurrentLocation] = useState<string>("");
    const [shipperName, setShipperName] = useState<string>("");
    const [shipperPhone, setShipperPhone] = useState<string>("");
    const [receivedBy, setReceivedBy] = useState<string>("");

    const shipment = shipmentQuery.data?.data;

    // Prepopulate GOSHIP shipment details if available
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
        
        setUpdateReason("");
        setReceivedBy("");
        setCurrentLocation("");
        setShipperName("");
        setShipperPhone("");
    }, [shipment]);

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                <Loader2 className="mx-auto mb-2 size-5 animate-spin text-slate-400" />
                Đang tải chi tiết đơn hàng...
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Không thể tải chi tiết đơn hàng: {error?.message || "Đã xảy ra lỗi"}
            </div>
        );
    }

    const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const allowedNextStatuses = getAdminAllowedNextStatuses(order.status);

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/orders" className="gap-1.5">
                        <ArrowLeft className="size-4" />
                        Quay lại danh sách đơn
                    </Link>
                </Button>
                <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500">Đơn #{order.id}</span>
            </div>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Trạng thái đơn hàng:</span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-100">
                        {ORDER_STATUS_LABEL[order.status]}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Cập nhật trạng thái:</span>
                    <Select
                        value={selectedStatus || order.status}
                        onValueChange={(value) => {
                            if (value === order.status) {
                                setSelectedStatus("");
                            } else {
                                setSelectedStatus(value as OrderStatus);
                            }
                            setUpdateReason(""); // Clear reasons
                            setReceivedBy("");
                            setCurrentLocation("");
                            setShipperName("");
                            setShipperPhone("");
                        }}
                        disabled={isUpdatingStatus || allowedNextStatuses.length === 0}
                    >
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue placeholder="Cập nhật trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key={`current-${order.status}`} value={order.status} disabled>
                                {ORDER_STATUS_LABEL[order.status]} (hiện tại)
                            </SelectItem>
                            {allowedNextStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {ORDER_STATUS_LABEL[status]}
                                </SelectItem>
                            ))}
                            {allowedNextStatuses.length === 0 ? (
                                <div className="px-2 py-1.5 text-xs text-slate-500">Không có trạng thái kế tiếp hợp lệ.</div>
                            ) : null}
                        </SelectContent>
                    </Select>
                </div>
            </article>

            {/* Conditionally rendered confirmation panel for manual order status change */}
            {selectedStatus && selectedStatus !== order.status && (
                <article className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <Settings className="size-4 animate-spin" style={{ animationDuration: '4s' }} /> Xác nhận cập nhật trạng thái đơn hàng
                    </div>
                    <p className="text-xs text-slate-600">
                        Bạn đang thay đổi trạng thái đơn hàng từ <strong className="text-slate-800">"{ORDER_STATUS_LABEL[order.status]}"</strong> sang <strong className="text-primary">"{ORDER_STATUS_LABEL[selectedStatus]}"</strong>.
                    </p>

                    {/* Rule: CANCELED requires reason */}
                    {selectedStatus === "canceled" && (
                        <div className="space-y-1.5 animate-in fade-in duration-300">
                            <Label htmlFor="admin-cancel-reason" className="text-xs font-semibold text-slate-700">
                                Lý do hủy đơn hàng <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="admin-cancel-reason"
                                type="text"
                                placeholder="Ví dụ: Khách hàng yêu cầu hủy đơn, hết hàng..."
                                value={updateReason}
                                onChange={(e) => setUpdateReason(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    )}

                    {/* Rule: AWAITING_PICKUP requires trackingCode, optional carrierName (auto-provided by order.shippingMethod), optional trackingUrl */}
                    {selectedStatus === "awaiting_pickup" && (
                        <div className="space-y-4 border-t border-slate-100/50 pt-3 animate-in fade-in duration-300">
                            <div className="space-y-1.5">
                                <Label htmlFor="admin-tracking-code" className="text-xs font-semibold text-slate-700">
                                    Mã vận đơn <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="admin-tracking-code"
                                    type="text"
                                    placeholder="Ví dụ: GHTK_TEST_123456789"
                                    value={customTrackingCode}
                                    onChange={(e) => setCustomTrackingCode(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="admin-tracking-url" className="text-xs font-semibold text-slate-700">
                                    Đường dẫn tra cứu vận đơn
                                </Label>
                                <Input
                                    id="admin-tracking-url"
                                    type="text"
                                    placeholder="Ví dụ: https://donhang.ghn.vn/?order_code=..."
                                    value={trackingUrl}
                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Rule: IN_TRANSIT optional currentLocation */}
                    {selectedStatus === "in_transit" && (
                        <div className="space-y-1.5 border-t border-slate-100/50 pt-3 animate-in fade-in duration-300">
                            <Label htmlFor="admin-location" className="text-xs font-semibold text-slate-700">
                                Vị trí bưu cục trung chuyển hiện tại
                            </Label>
                            <Input
                                id="admin-location"
                                type="text"
                                placeholder="Ví dụ: Kho Hà Nội SOC, Bưu cục Quận Cầu Giấy"
                                value={currentLocation}
                                onChange={(e) => setCurrentLocation(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    )}

                    {/* Rule: OUT_FOR_DELIVERY optional shipper details */}
                    {selectedStatus === "out_for_delivery" && (
                        <div className="space-y-4 border-t border-slate-100/50 pt-3 animate-in fade-in duration-300">
                            <div className="space-y-1.5">
                                <Label htmlFor="admin-shipper-name" className="text-xs font-semibold text-slate-700">
                                    Tên bưu tá đi giao hàng
                                </Label>
                                <Input
                                    id="admin-shipper-name"
                                    type="text"
                                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                                    value={shipperName}
                                    onChange={(e) => setShipperName(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="admin-shipper-phone" className="text-xs font-semibold text-slate-700">
                                    Số điện thoại bưu tá
                                </Label>
                                <Input
                                    id="admin-shipper-phone"
                                    type="text"
                                    placeholder="Ví dụ: 0966777888"
                                    value={shipperPhone}
                                    onChange={(e) => setShipperPhone(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Rule: DELIVERED optional receivedBy */}
                    {selectedStatus === "delivered" && (
                        <div className="space-y-1.5 border-t border-slate-100/50 pt-3 animate-in fade-in duration-300">
                            <Label htmlFor="admin-received-by" className="text-xs font-semibold text-slate-700">
                                Tên người ký nhận bưu phẩm
                            </Label>
                            <Input
                                id="admin-received-by"
                                type="text"
                                placeholder="Ví dụ: Chính chủ nhận, Bảo vệ nhận hộ..."
                                value={receivedBy}
                                onChange={(e) => setReceivedBy(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    )}

                    {/* Normal notes field for other states, but excluded for confirmed as requested */}
                    {selectedStatus !== "confirmed" && selectedStatus !== "canceled" && selectedStatus !== "awaiting_pickup" && selectedStatus !== "in_transit" && selectedStatus !== "out_for_delivery" && selectedStatus !== "delivered" && (
                        <div className="space-y-1.5 animate-in fade-in duration-300">
                            <Label htmlFor="admin-notes" className="text-xs font-semibold text-slate-700">
                                Ghi chú cập nhật
                            </Label>
                            <Input
                                id="admin-notes"
                                type="text"
                                placeholder="Nhập ghi chú hoặc lý do thay đổi..."
                                value={updateReason}
                                onChange={(e) => setUpdateReason(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            disabled={isUpdatingStatus}
                            onClick={() => {
                                // Validation
                                if (selectedStatus === "canceled" && !updateReason.trim()) {
                                    toast.error("Vui lòng nhập Lý do hủy đơn hàng");
                                    return;
                                }
                                if (selectedStatus === "delivery_failed" && !updateReason.trim()) {
                                    toast.error("Vui lòng nhập Lý do giao thất bại");
                                    return;
                                }
                                if (selectedStatus === "awaiting_pickup" && !customTrackingCode.trim()) {
                                    toast.error("Vui lòng nhập Mã vận đơn");
                                    return;
                                }

                                const targetStatus = selectedStatus;

                                updateStatus(
                                    {
                                        id: order.id,
                                        payload: {
                                            status: targetStatus,
                                            reason: (targetStatus === "canceled" || targetStatus !== "confirmed" && targetStatus !== "awaiting_pickup" && targetStatus !== "in_transit" && targetStatus !== "out_for_delivery" && targetStatus !== "delivered") ? updateReason.trim() : undefined,
                                            trackingCode: targetStatus === "awaiting_pickup" ? customTrackingCode.trim() : undefined,
                                            carrierName: targetStatus === "awaiting_pickup" ? order.shippingMethod : undefined, // Automatically use carrier from order
                                            trackingUrl: targetStatus === "awaiting_pickup" ? trackingUrl.trim() : undefined,
                                            currentLocation: targetStatus === "in_transit" ? currentLocation.trim() : undefined,
                                            shipperName: targetStatus === "out_for_delivery" ? shipperName.trim() : undefined,
                                            shipperPhone: targetStatus === "out_for_delivery" ? shipperPhone.trim() : undefined,
                                            receivedBy: targetStatus === "delivered" ? receivedBy.trim() : undefined,
                                        }
                                    },
                                    {
                                        onSuccess: () => {
                                            toast.success(`Đã cập nhật đơn #${order.id} -> ${ORDER_STATUS_LABEL[targetStatus]}`);
                                            setSelectedStatus(""); // Reset to empty to fall back to order.status
                                            setUpdateReason("");
                                            setReceivedBy("");
                                            setCurrentLocation("");
                                            setShipperName("");
                                            setShipperPhone("");
                                            refetchOrder();
                                            shipmentQuery.refetch();
                                        },
                                        onError: (updateError: Error) => {
                                            toast.error(updateError.message || "Không thể cập nhật trạng thái.");
                                            setSelectedStatus(""); // Reset to original
                                        },
                                    }
                                );
                            }}
                        >
                            {isUpdatingStatus ? "Đang lưu..." : "Xác nhận cập nhật"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isUpdatingStatus}
                            onClick={() => {
                                setSelectedStatus("");
                                setUpdateReason("");
                                setReceivedBy("");
                                setCurrentLocation("");
                                setShipperName("");
                                setShipperPhone("");
                            }}
                        >
                            Hủy bỏ
                        </Button>
                    </div>
                </article>
            )}

            <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                <h1 className="text-lg font-bold text-slate-900">Thông tin đơn hàng</h1>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <p>Người nhận: <span className="font-medium text-slate-800">{order.recipientName}</span></p>
                    <p>SĐT: <span className="font-medium text-slate-800">{order.recipientPhone || "-"}</span></p>
                    <p>Ngày tạo: <span className="font-medium text-slate-800">{formatDateTime(order.createdAt)}</span></p>
                    <p>Cập nhật: <span className="font-medium text-slate-800">{formatDateTime(order.updatedAt)}</span></p>
                    <p>Vận chuyển: <span className="font-medium text-slate-800">{order.shippingMethod}</span></p>
                    <p>Số lượng SP: <span className="font-medium text-slate-800">{totalItems}</span></p>
                    {order.note ? <p className="sm:col-span-2">Ghi chú: <span className="font-medium text-slate-800">{order.note}</span></p> : null}
                    <p className="sm:col-span-2">
                        Địa chỉ: <AddressDisplay address={order} className="font-medium text-slate-800" />
                    </p>
                </div>
            </article>

            {order.status !== "pending" && (
                shipmentQuery.isLoading ? (
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-3">
                        <div className="h-5 w-48 bg-slate-200 rounded" />
                        <div className="h-20 bg-slate-100 rounded" />
                    </article>
                ) : shipmentQuery.data?.data ? (
                    (() => {
                        const shipment = shipmentQuery.data.data;

                        return (
                            <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm space-y-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <Truck className="size-5 text-slate-700" />
                                        <h2 className="text-base font-bold text-slate-900">Thông tin Vận chuyển & Hành trình</h2>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="gap-1.5 font-semibold text-sky-700 border-sky-200 bg-sky-50/50 hover:bg-sky-50">
                                        <Link to={`/admin/shipments/simulate?orderId=${order.id}`}>
                                            <Settings className="size-3.5" /> Giả lập Sandbox Webhook
                                        </Link>
                                    </Button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
                                    <p className="text-xs text-slate-500">
                                        Hãng: <span className="font-semibold text-slate-800">{shipment.carrierName || shipment.shipmentProvider || "-"}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Mã Goship: <span className="font-mono font-medium text-slate-800">{shipment.shipmentId || "-"}</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Trạng thái hiện tại: <span className="font-semibold text-sky-700">{shipment.shipmentStatus || "Chưa có"}</span>
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <ShipmentTrackingTimeline orderId={orderId} />
                                </div>
                            </article>
                        );
                    })()
                ) : null
            )}

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Danh sách sản phẩm</h2>
                <div className="mt-4 divide-y divide-slate-100">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                            <div className="flex items-center gap-3">
                                {item.variant.product.thumbnail ? (
                                    <img
                                        src={item.variant.product.thumbnail}
                                        alt={item.variant.product.name}
                                        className="size-12 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="size-12 rounded-lg bg-slate-100" />
                                )}
                                <div>
                                    <h4 className="font-semibold text-slate-800">{item.variant.product.name}</h4>
                                    <p className="text-xs text-slate-400">Phân loại: {item.variant.color} - Size {item.variant.size}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-slate-800">{formatCurrency(Number(item.price))}</p>
                                <p className="text-xs text-slate-400">x{item.quantity}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Tổng kết thanh toán</h2>
                <div className="mt-3 space-y-2 text-slate-500">
                    <div className="flex justify-between">
                        <span>Tạm tính ({totalItems} sản phẩm)</span>
                        <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Phí vận chuyển</span>
                        <span className="font-medium text-slate-800">{formatCurrency(Number(order.shippingFee))}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                        <span>Tổng cộng</span>
                        <span className="text-primary">{formatCurrency(Number(order.totalAmount))}</span>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default OrderDetailAdminPage;
