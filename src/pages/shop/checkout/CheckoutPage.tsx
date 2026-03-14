import { useMemo } from "react";
import { Link, Navigate } from "react-router";

import { Button } from "@/components/ui/button";
import { clearCheckoutSession, getCheckoutSession } from "@/lib/checkout";
import { formatCurrency } from "@/lib/utils";

const CheckoutPage = () => {
    const session = useMemo(() => getCheckoutSession(), []);

    if (!session || session.items.length === 0) {
        return <Navigate to="/cart" replace />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Thanh toán</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Bạn đang thanh toán {session.items.length} sản phẩm đã chọn.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <section className="space-y-3">
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
                                        No img
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-semibold text-slate-800">{item.productName}</p>
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
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-slate-500">Số lượng: {item.quantity}</p>
                                <p className="text-sm font-bold text-slate-900">{formatCurrency(item.lineTotal)}</p>
                            </div>
                        </article>
                    ))}
                </section>

                <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-4 text-base font-semibold text-slate-900">Tóm tắt thanh toán</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Tạm tính</span>
                            <span className="font-medium text-slate-800">{formatCurrency(session.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Phí vận chuyển</span>
                            <span className="font-medium text-slate-800">{formatCurrency(session.shippingFee)}</span>
                        </div>
                    </div>

                    <div className="my-4 h-px bg-slate-200" />

                    <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">TỔNG CỘNG</span>
                        <span className="text-xl font-black text-primary">{formatCurrency(session.total)}</span>
                    </div>

                    <Button className="mt-5 h-11 w-full text-sm font-semibold">Đặt hàng</Button>

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
