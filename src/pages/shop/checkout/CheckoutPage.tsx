import { Banknote, MapPin, Package, TicketPercent, Truck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMyAddresses } from "@/hooks/useAddresses";
import { useBestPublicCoupons, useCoupons } from "@/hooks/useCoupons";
import { useCreateOrder } from "@/hooks/useOrders";
import { clearCheckoutSession, getCheckoutSession } from "@/lib/checkout";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Coupon } from "@/types/coupon";
import type { ShippingMethod } from "@/types/order";

type ShippingOption = {
    id: string;
    name: string;
    description: string;
    fee: number;
};

const SHIPPING_METHODS: ShippingOption[] = [
    {
        id: "standard",
        name: "Tiêu chuẩn",
        description: "5 - 7 ngày",
        fee: 10000,
    },
    {
        id: "express",
        name: "Hỏa tốc",
        description: "2 - 3 ngày",
        fee: 20000,
    },
];

const DEFAULT_VISIBLE_COUPONS = 2;

const calculateCouponDiscount = (coupon: Coupon | null, subtotal: number, shippingFee: number) => {
    if (!coupon) {
        return 0;
    }

    if (subtotal < coupon.minOrderAmount) {
        return 0;
    }

    if (coupon.type === "shipping") {
        return shippingFee;
    }

    if (coupon.type === "fixed") {
        return Math.min(subtotal, coupon.value);
    }

    const percentDiscount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscountAmount > 0) {
        return Math.min(percentDiscount, coupon.maxDiscountAmount);
    }

    return percentDiscount;
};

const CheckoutPage = () => {
    const session = useMemo(() => getCheckoutSession(), []);
    const [shippingMethodId, setShippingMethodId] = useState<string>(SHIPPING_METHODS[0].id);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [addressDialogOpen, setAddressDialogOpen] = useState(false);
    const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"paypal" | "cod">("cod");
    const [orderNote, setOrderNote] = useState("");
    const [manualVoucherCode, setManualVoucherCode] = useState("");
    const [showAllCoupons, setShowAllCoupons] = useState(false);
    const [isAutoCouponDisabled, setIsAutoCouponDisabled] = useState(false);
    const [voucherFeedback, setVoucherFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
        null
    );
    const { mutate: createOrder, isPending: isCreatingOrder } = useCreateOrder();
    const { data: addressesData, isLoading: isLoadingAddresses } = useMyAddresses();
    const { data: couponsData } = useCoupons({
        page: 1,
        limit: 100,
        sortBy: "endDate",
        sortOrder: "ASC",
    });
    const sessionItems = session?.items ?? [];
    const sessionSubtotal = session?.subtotal ?? 0;

    const bestCouponPayload = useMemo(
        () => ({
            items: sessionItems.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
            })),
        }),
        [sessionItems]
    );

    const { data: bestCouponsData } = useBestPublicCoupons(bestCouponPayload, sessionItems.length > 0);

    if (!session || session.items.length === 0) {
        return <Navigate to="/cart" replace />;
    }

    const selectedShipping =
        SHIPPING_METHODS.find((shipping) => shipping.id === shippingMethodId) ?? SHIPPING_METHODS[0];
    const addresses = addressesData?.data ?? [];
    const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;

    const availableCoupons = useMemo(() => {
        const now = new Date();
        const allCoupons = couponsData?.data ?? [];

        return allCoupons.filter((coupon) => {
            if (!coupon.isActive || !coupon.isPublic || coupon.status !== "active") {
                return false;
            }

            const startDate = new Date(coupon.startDate);
            const endDate = new Date(coupon.endDate);
            if (startDate > now || endDate <= now) {
                return false;
            }

            if (coupon.minOrderAmount > sessionSubtotal) {
                return false;
            }

            if (!coupon.applicableProduct) {
                return true;
            }

            return sessionItems.some((item) => item.productId === coupon.applicableProduct);
        });
    }, [couponsData?.data, sessionItems, sessionSubtotal]);

    const bestCoupons = bestCouponsData?.data ?? [];
    const bestCouponIdSet = useMemo(() => new Set(bestCoupons.map((coupon) => coupon.id)), [bestCoupons]);

    const couponPool = useMemo(() => {
        const couponMap = new Map<number, Coupon>();

        for (const coupon of bestCoupons) {
            couponMap.set(coupon.id, coupon);
        }

        for (const coupon of availableCoupons) {
            couponMap.set(coupon.id, coupon);
        }

        return Array.from(couponMap.values());
    }, [availableCoupons, bestCoupons]);

    const selectedCoupon = couponPool.find((coupon) => coupon.id === selectedCouponId) ?? null;
    const visibleCoupons = showAllCoupons
        ? couponPool
        : couponPool.slice(0, DEFAULT_VISIBLE_COUPONS);

    useEffect(() => {
        if (selectedAddressId || addresses.length === 0) {
            return;
        }

        const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
        setSelectedAddressId(defaultAddress.id);
    }, [addresses, selectedAddressId]);

    useEffect(() => {
        if (selectedCouponId && !couponPool.some((coupon) => coupon.id === selectedCouponId)) {
            setSelectedCouponId(null);
        }
    }, [couponPool, selectedCouponId]);

    useEffect(() => {
        if (isAutoCouponDisabled || selectedCouponId) {
            return;
        }

        const bestCoupon = bestCoupons[0];
        if (!bestCoupon) {
            return;
        }

        setSelectedCouponId(bestCoupon.id);
        setManualVoucherCode(bestCoupon.code);
        setShowAllCoupons(true);
        setVoucherFeedback({
            type: "success",
            message: `Đã tự động áp dụng mã tốt nhất: ${bestCoupon.code}.`,
        });
    }, [bestCoupons, isAutoCouponDisabled, selectedCouponId]);

    const handleApplyManualVoucher = () => {
        const code = manualVoucherCode.trim().toUpperCase();

        if (!code) {
            setVoucherFeedback({ type: "error", message: "Vui lòng nhập mã giảm giá." });
            return;
        }

        const foundCoupon = couponPool.find((coupon) => coupon.code.toUpperCase() === code);

        if (!foundCoupon) {
            setVoucherFeedback({ type: "error", message: "Mã không hợp lệ hoặc đã hết hạn." });
            return;
        }

        setSelectedCouponId(foundCoupon.id);
        setIsAutoCouponDisabled(true);
        setManualVoucherCode(foundCoupon.code);
        setShowAllCoupons(true);
        setVoucherFeedback({ type: "success", message: `Đã áp dụng mã ${foundCoupon.code}.` });
    };

    const handlePlaceOrder = () => {
        if (!selectedAddressId) {
            toast.error("Vui lòng chọn địa chỉ giao hàng.");
            return;
        }

        const noteParts = [orderNote.trim()];
        noteParts.push(`Payment: ${paymentMethod}`);

        createOrder(
            {
                addressId: selectedAddressId,
                couponId: selectedCoupon?.id,
                shippingMethod: shippingMethodId as ShippingMethod,
                note: noteParts.filter(Boolean).join(" | ") || undefined,
                items: session.items.map((item) => ({
                    variantId: item.variantId,
                    quantity: item.quantity,
                })),
            },
            {
                onSuccess: () => {
                    toast.success("Đặt hàng thành công.");
                    clearCheckoutSession();
                    window.location.href = "/my-account/orders";
                },
                onError: (error) => {
                    toast.error(`Đặt hàng thất bại: ${error.message}`);
                },
            }
        );
    };

    const subtotal = session.subtotal;
    const shippingFee = selectedShipping.fee;
    const discount = calculateCouponDiscount(selectedCoupon, subtotal, shippingFee);
    const total = Math.max(0, subtotal + shippingFee - discount);

    return (
        <div className="space-y-5">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-slate-900">Thanh toán</h1>
                <p className="text-sm text-slate-500">
                    Đơn hàng được tạo lúc {formatDateTime(session.createdAt)} với {session.items.length} sản phẩm.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <section className="space-y-5">
                    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <MapPin className="size-4" />
                                Địa chỉ giao hàng
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-3 text-primary"
                                onClick={() => setAddressDialogOpen(true)}
                                disabled={isLoadingAddresses || addresses.length === 0}
                            >
                                Thay đổi
                            </Button>
                        </div>

                        {isLoadingAddresses ? (
                            <p className="mt-3 text-sm text-slate-500">Đang tải địa chỉ...</p>
                        ) : addresses.length === 0 ? (
                            <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                                Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trước khi đặt hàng.
                                <div className="mt-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/my-account/addresses">Thêm địa chỉ</Link>
                                    </Button>
                                </div>
                            </div>
                        ) : selectedAddress ? (
                            <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-600">
                                <span className="font-medium text-slate-800">{selectedAddress.recipientName}</span>
                                <span className="mx-2 text-slate-300">|</span>
                                {selectedAddress.recipientPhone}
                                <span className="mx-2 text-slate-300">-</span>
                                {`${selectedAddress.detailAddress}, ${selectedAddress.commune}, ${selectedAddress.district}, ${selectedAddress.province}`}
                            </div>
                        ) : null}

                        <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Chọn địa chỉ giao hàng</DialogTitle>
                                    <DialogDescription>
                                        Chọn địa chỉ bạn muốn nhận hàng cho đơn này.
                                    </DialogDescription>
                                </DialogHeader>

                                <RadioGroup
                                    className="max-h-[50vh] space-y-2 overflow-y-auto pr-1"
                                    value={selectedAddressId ? String(selectedAddressId) : ""}
                                    onValueChange={(value) => setSelectedAddressId(Number(value))}
                                >
                                    {addresses.map((address) => (
                                        <label
                                            key={address.id}
                                            className={cn(
                                                "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                                                selectedAddressId === address.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-slate-200"
                                            )}
                                        >
                                            <RadioGroupItem value={String(address.id)} id={`address-${address.id}`} />
                                            <p className="text-sm text-slate-600">
                                                <span className="font-medium text-slate-800">{address.recipientName}</span>
                                                <span className="mx-2 text-slate-300">|</span>
                                                {address.recipientPhone}
                                                <span className="mx-2 text-slate-300">-</span>
                                                {`${address.detailAddress}, ${address.commune}, ${address.district}, ${address.province}`}
                                            </p>
                                        </label>
                                    ))}
                                </RadioGroup>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setAddressDialogOpen(false)}>
                                        Xong
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Truck className="size-4" />
                            Phương thức vận chuyển
                        </h2>

                        <RadioGroup
                            className="mt-3 space-y-3"
                            value={shippingMethodId}
                            onValueChange={(value) => setShippingMethodId(value)}
                        >
                            {SHIPPING_METHODS.map((method) => {
                                const isChecked = method.id === shippingMethodId;

                                return (
                                    <label
                                        key={method.id}
                                        className={cn(
                                            "flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors",
                                            isChecked
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-200 hover:border-primary/40"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value={method.id} id={`shipping-${method.id}`} />

                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {formatCurrency(method.fee)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {method.name} ({method.description})
                                                </p>
                                            </div>
                                        </div>

                                        <Package className="size-4 text-primary" />
                                    </label>
                                );
                            })}
                        </RadioGroup>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Package className="size-4" />
                            Sản phẩm
                        </h2>

                        <div className="mt-3 space-y-3">
                            {session.items.map((item) => {
                                return (
                                    <article
                                        key={`${item.cartItemId}-${item.variantId}`}
                                        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                                    >
                                        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.productName}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                    Không có ảnh
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                                                {item.productName}
                                            </p>

                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                {item.colorName ? (
                                                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                        {item.colorName}
                                                    </span>
                                                ) : null}
                                                {item.sizeName ? (
                                                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                        {item.sizeName}
                                                    </span>
                                                ) : null}
                                                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-24 text-right text-sm font-bold text-slate-900">
                                            {formatCurrency(item.unitPrice * item.quantity)}
                                        </div>
                                    </article>
                                )
                            }

                            )}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <TicketPercent className="size-4" />
                                Mã giảm giá
                            </h2>

                            {!showAllCoupons && availableCoupons.length > DEFAULT_VISIBLE_COUPONS ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-primary"
                                    onClick={() => setShowAllCoupons(true)}
                                >
                                    Xem thêm
                                </Button>
                            ) : null}
                        </div>

                        <form
                            className="mt-3 flex flex-col gap-2 sm:flex-row"
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleApplyManualVoucher();
                            }}
                        >
                            <Input
                                value={manualVoucherCode}
                                onChange={(event) => {
                                    setManualVoucherCode(event.target.value);
                                    if (voucherFeedback) {
                                        setVoucherFeedback(null);
                                    }
                                }}
                                placeholder="Nhập mã voucher riêng"
                                className="h-10"
                            />
                            <Button type="submit" className="h-10 px-5 sm:w-auto">
                                Áp dụng
                            </Button>
                        </form>

                        {voucherFeedback ? (
                            <p
                                className={cn(
                                    "mt-2 text-xs",
                                    voucherFeedback.type === "success" ? "text-emerald-600" : "text-red-500"
                                )}
                            >
                                {voucherFeedback.message}
                            </p>
                        ) : null}

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {visibleCoupons.map((coupon) => {
                                const isChecked = coupon.id === selectedCouponId;
                                const isBestCoupon = bestCouponIdSet.has(coupon.id);

                                return (
                                    <button
                                        key={coupon.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCouponId(coupon.id);
                                            setIsAutoCouponDisabled(true);
                                            setManualVoucherCode(coupon.code);
                                        }}
                                        className={cn(
                                            "relative rounded-xl border p-3 text-left transition-colors",
                                            isChecked
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-200 hover:border-primary/40"
                                        )}
                                    >
                                        <p className="text-xs font-medium uppercase tracking-wide text-primary">
                                            {coupon.name || coupon.type}
                                        </p>
                                        {isBestCoupon ? (
                                            <span className="absolute right-2 top-2 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                                                Tốt nhất
                                            </span>
                                        ) : null}
                                        <p className="mt-1 text-base font-bold text-slate-900">{coupon.code}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Hạn dùng: {formatDate(coupon.endDate)}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-emerald-600">
                                            {coupon.type === "percent"
                                                ? `-${coupon.value}%`
                                                : coupon.type === "shipping"
                                                    ? "Miễn phí vận chuyển"
                                                    : `-${formatCurrency(coupon.value)}`}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            className="mt-3 h-8 px-3 text-xs text-slate-500"
                            onClick={() => {
                                setSelectedCouponId(null);
                                setIsAutoCouponDisabled(true);
                                setVoucherFeedback(null);
                            }}
                        >
                            Bỏ chọn mã
                        </Button>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <Wallet className="size-4" />
                            Phương thức thanh toán
                        </h2>

                        <RadioGroup
                            className="mt-3 space-y-3"
                            value={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as "paypal" | "cod")}
                        >
                            <label
                                className={cn(
                                    "flex cursor-pointer items-start justify-between rounded-xl border p-3 transition-colors",
                                    paymentMethod === "paypal"
                                        ? "border-primary bg-primary/5"
                                        : "border-slate-200 hover:border-primary/40"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <RadioGroupItem value="paypal" id="payment-paypal" className="mt-0.5" />

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Thanh toán qua PayPal</p>
                                        <p className="text-xs text-slate-500">
                                            Bạn sẽ được chuyển hướng đến website PayPal sau khi đặt hàng.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500">
                                    PP
                                </div>
                            </label>

                            <label
                                className={cn(
                                    "flex cursor-pointer items-start justify-between rounded-xl border p-3 transition-colors",
                                    paymentMethod === "cod"
                                        ? "border-primary bg-primary/5"
                                        : "border-slate-200 hover:border-primary/40"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <RadioGroupItem value="cod" id="payment-cod" className="mt-0.5" />

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Thanh toán khi nhận hàng (COD)</p>
                                        <p className="text-xs text-slate-500">Thanh toán trực tiếp sau khi nhận được hàng.</p>
                                    </div>
                                </div>

                                <Banknote className="size-4 text-primary" />
                            </label>
                        </RadioGroup>
                    </article>
                </section>

                <aside className="h-fit p-5">
                    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Wallet className="size-4" />
                        Tóm tắt đơn hàng
                    </h2>

                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Tạm tính</span>
                            <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Phí vận chuyển</span>
                            <span className="font-medium text-slate-800">{formatCurrency(shippingFee)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Giảm giá</span>
                            <span className="font-medium text-emerald-600">-{formatCurrency(discount)}</span>
                        </div>
                    </div>

                    <div className="my-4 h-[0.5px] bg-slate-200" />

                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">TỔNG CỘNG</span>
                        <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
                    </div>

                    <div className="mt-5 space-y-3">
                        <Input
                            placeholder="Ghi chú đơn hàng..."
                            className="h-10"
                            value={orderNote}
                            onChange={(event) => setOrderNote(event.target.value)}
                        />
                        <Button
                            className="h-11 w-full text-sm font-semibold"
                            onClick={handlePlaceOrder}
                            disabled={isCreatingOrder || !selectedAddressId || addresses.length === 0}
                        >
                            {isCreatingOrder ? "Đang đặt hàng..." : "Đặt hàng"}
                        </Button>
                    </div>

                    <Button
                        asChild
                        variant="ghost"
                        className="mt-2 w-full text-sm text-slate-500"
                        onClick={() => clearCheckoutSession()}
                    >
                        <Link to="/cart">Quay lại giỏ hàng</Link>
                    </Button>
                </aside>
            </div>
        </div>
    );
};

export default CheckoutPage;
