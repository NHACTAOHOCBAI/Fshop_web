import { Banknote, MapPin, Package, TicketPercent, Truck, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { clearCheckoutSession, getCheckoutSession } from "@/lib/checkout";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type ShippingMethod = {
    id: string;
    name: string;
    description: string;
    fee: number;
};

type Coupon = {
    id: string;
    title: string;
    code: string;
    discount: number;
    expiresAt: string;
};

const SHIPPING_METHODS: ShippingMethod[] = [
    {
        id: "standard",
        name: "Tiêu chuẩn",
        description: "5 - 7 ngày",
        fee: 20000,
    },
    {
        id: "fast",
        name: "Giao nhanh",
        description: "2 - 3 ngày",
        fee: 45000,
    },
];

const MOCK_COUPONS: Coupon[] = [
    {
        id: "fshop2025",
        title: "Giảm trực tiếp 25%",
        code: "FSHOP2025",
        discount: 30000,
        expiresAt: "2026-03-30T23:59:59.000Z",
    },
    {
        id: "freeship",
        title: "Miễn phí vận chuyển",
        code: "FREESHIP",
        discount: 20000,
        expiresAt: "2026-03-30T23:59:59.000Z",
    },
    {
        id: "weekend",
        title: "Cuối tuần",
        code: "WEEKEND",
        discount: 50000,
        expiresAt: "2026-03-24T23:59:59.000Z",
    },
];

const PRIVATE_COUPONS: Coupon[] = [
    {
        id: "private-vip30",
        title: "Mã riêng khách VIP",
        code: "VIP30",
        discount: 70000,
        expiresAt: "2026-03-31T23:59:59.000Z",
    },
    {
        id: "private-friend",
        title: "Mã riêng nội bộ",
        code: "FRIEND50",
        discount: 50000,
        expiresAt: "2026-03-31T23:59:59.000Z",
    },
];

const DEFAULT_VISIBLE_COUPONS = 2;

const MOCK_ADDRESS = {
    receiver: "Zabit Magomedsharipov",
    phone: "0901 234 567",
    line: "Dormitory B, VNU - HCMC, Dong Hoa Ward, Di An City, Binh Duong Province, Vietnam",
};

const CheckoutPage = () => {
    const session = useMemo(() => getCheckoutSession(), []);
    const [shippingMethodId, setShippingMethodId] = useState<string>(SHIPPING_METHODS[0].id);
    const [selectedCouponId, setSelectedCouponId] = useState<string | null>(MOCK_COUPONS[0].id);
    const [paymentMethod, setPaymentMethod] = useState<"paypal" | "cod">("cod");
    const [manualVoucherCode, setManualVoucherCode] = useState("");
    const [showAllCoupons, setShowAllCoupons] = useState(false);
    const [voucherFeedback, setVoucherFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
        null
    );

    if (!session || session.items.length === 0) {
        return <Navigate to="/cart" replace />;
    }

    const selectedShipping =
        SHIPPING_METHODS.find((shipping) => shipping.id === shippingMethodId) ?? SHIPPING_METHODS[0];
    const allCoupons = [...MOCK_COUPONS, ...PRIVATE_COUPONS];
    const selectedCoupon = allCoupons.find((coupon) => coupon.id === selectedCouponId) ?? null;
    const visibleCoupons = showAllCoupons ? MOCK_COUPONS : MOCK_COUPONS.slice(0, DEFAULT_VISIBLE_COUPONS);

    const handleApplyManualVoucher = () => {
        const code = manualVoucherCode.trim().toUpperCase();

        if (!code) {
            setVoucherFeedback({ type: "error", message: "Vui lòng nhập mã giảm giá." });
            return;
        }

        const foundCoupon = allCoupons.find((coupon) => coupon.code.toUpperCase() === code);

        if (!foundCoupon) {
            setVoucherFeedback({ type: "error", message: "Mã không hợp lệ hoặc đã hết hạn." });
            return;
        }

        setSelectedCouponId(foundCoupon.id);
        setManualVoucherCode(foundCoupon.code);
        setShowAllCoupons(true);
        setVoucherFeedback({ type: "success", message: `Đã áp dụng mã ${foundCoupon.code}.` });
    };

    const subtotal = session.subtotal;
    const shippingFee = selectedShipping.fee;
    const discount = selectedCoupon?.discount ?? 0;
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
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-primary">
                                Thay đổi
                            </Button>
                        </div>

                        <div className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                            <RadioGroup value="default-address" className="shrink-0">
                                <RadioGroupItem value="default-address" id="default-address" />
                            </RadioGroup>
                            <p className="text-sm text-slate-600">
                                <span className="font-medium text-slate-800">{MOCK_ADDRESS.receiver}</span>
                                <span className="mx-2 text-slate-300">|</span>
                                {MOCK_ADDRESS.phone}
                                <span className="mx-2 text-slate-300">-</span>
                                {MOCK_ADDRESS.line}
                            </p>
                        </div>
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
                            {session.items.map((item) => (
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
                                        {formatCurrency(item.lineTotal)}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </article>

                    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <TicketPercent className="size-4" />
                                Mã giảm giá
                            </h2>

                            {!showAllCoupons && MOCK_COUPONS.length > DEFAULT_VISIBLE_COUPONS ? (
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

                                return (
                                    <button
                                        key={coupon.id}
                                        type="button"
                                        onClick={() => setSelectedCouponId(coupon.id)}
                                        className={cn(
                                            "rounded-xl border p-3 text-left transition-colors",
                                            isChecked
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-200 hover:border-primary/40"
                                        )}
                                    >
                                        <p className="text-xs font-medium uppercase tracking-wide text-primary">
                                            {coupon.title}
                                        </p>
                                        <p className="mt-1 text-base font-bold text-slate-900">{coupon.code}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Hạn dùng: {formatDate(coupon.expiresAt)}
                                        </p>
                                        <p className="mt-1 text-xs font-semibold text-emerald-600">
                                            -{formatCurrency(coupon.discount)}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            className="mt-3 h-8 px-3 text-xs text-slate-500"
                            onClick={() => setSelectedCouponId(null)}
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
                        <Input placeholder="Ghi chú đơn hàng..." className="h-10" />
                        <Button className="h-11 w-full text-sm font-semibold">Đặt hàng</Button>
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
