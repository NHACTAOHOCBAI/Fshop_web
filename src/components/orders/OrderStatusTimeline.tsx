import { CheckCircle2, Circle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/order";

type TimelineStep = {
    key: OrderStatus;
    label: string;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    delivered: "Đã giao",
    canceled: "Đã hủy",
    return_requested: "Yêu cầu trả hàng",
    returned: "Đã trả hàng",
    refunded: "Đã hoàn tiền",
};

const MAIN_FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

const toSteps = (flow: readonly OrderStatus[]): TimelineStep[] =>
    flow.map((item) => ({ key: item, label: STATUS_LABEL[item] }));

const buildFlow = (status: OrderStatus): TimelineStep[] => {
    if (MAIN_FLOW.includes(status)) {
        return toSteps(MAIN_FLOW);
    }

    if (status === "canceled") {
        return toSteps(["pending", "confirmed", "canceled"] as const);
    }

    if (status === "return_requested") {
        return toSteps(["pending", "confirmed", "processing", "shipped", "delivered", "return_requested"] as const);
    }

    if (status === "returned") {
        return toSteps(["pending", "confirmed", "processing", "shipped", "delivered", "return_requested", "returned"] as const);
    }

    return toSteps(["pending", "confirmed", "processing", "shipped", "delivered", "return_requested", "returned", "refunded"] as const);
};

type OrderStatusTimelineProps = {
    currentStatus: OrderStatus;
};

const OrderStatusTimeline = ({ currentStatus }: OrderStatusTimelineProps) => {
    const steps = buildFlow(currentStatus);
    const currentIndex = steps.findIndex((step) => step.key === currentStatus);
    const currentColorClass = "border-slate-900 bg-slate-900 text-white";
    const currentTextClass = "font-semibold text-slate-900";
    const doneColorClass = "border-slate-900 bg-slate-900 text-white";
    const doneTextClass = "text-slate-700";
    const connectorDoneClass = "bg-slate-900";

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Tiến trình đơn hàng</h3>
            <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max items-center gap-0">
                    {steps.map((step, index) => {
                        const isDone = index < currentIndex;
                        const isCurrent = index === currentIndex;

                        return (
                            <div key={step.key} className="flex items-center">
                                <div className="flex flex-col items-center px-2">
                                    <span
                                        className={cn(
                                            "inline-flex size-6 items-center justify-center rounded-full border",
                                            isDone && doneColorClass,
                                            isCurrent && currentColorClass,
                                            !isDone && !isCurrent && "border-slate-300 bg-white text-slate-300"
                                        )}
                                    >
                                        {isDone ? <CheckCircle2 className="size-4" /> : <Circle className="size-3" />}
                                    </span>
                                    <span
                                        className={cn(
                                            "mt-1 max-w-27.5 text-center text-[11px]",
                                            isDone && doneTextClass,
                                            isCurrent && currentTextClass,
                                            !isDone && !isCurrent && "text-slate-400"
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>

                                {index < steps.length - 1 ? (
                                    <span
                                        className={cn(
                                            "mb-5 block h-0.5 w-8",
                                            index < currentIndex ? connectorDoneClass : "bg-slate-200"
                                        )}
                                    />
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default OrderStatusTimeline;
