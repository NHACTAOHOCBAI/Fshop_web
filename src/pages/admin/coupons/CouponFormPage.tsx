import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCoupon, useCouponById, useUpdateCoupon } from "@/hooks/useCoupons";
import { useProducts } from "@/hooks/useProducts";
import type { CouponStatus, CouponType } from "@/types/coupon";

const couponTypeOptions: { value: CouponType; label: string }[] = [
    { value: "fixed", label: "Giảm cố định" },
    { value: "percent", label: "Giảm %" },
    { value: "shipping", label: "Miễn phí vận chuyển" },
];

const couponStatusOptions: { value: CouponStatus; label: string }[] = [
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Tạm tắt" },
    { value: "expired", label: "Hết hạn" },
];

const couponFormSchema = z.object({
    code: z.string().trim().min(1, "Mã giảm giá là bắt buộc"),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(["fixed", "percent", "shipping"]),
    value: z.number().min(0, "Giá trị không hợp lệ"),
    minOrderAmount: z.number().min(0, "Tối thiểu là 0"),
    maxDiscountAmount: z.number().min(0, "Tối thiểu là 0"),
    maxUses: z.number().min(0, "Tối thiểu là 0"),
    perUserLimit: z.number().min(0, "Tối thiểu là 0"),
    applyScope: z.enum(["all", "product"]),
    applicableProduct: z.string().optional(),
    startDate: z.date({ error: "Ngày bắt đầu là bắt buộc" }),
    endDate: z.date({ error: "Ngày kết thúc là bắt buộc" }),
    status: z.enum(["active", "expired", "inactive"]),
    isPublic: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponFormSchema>;

type CouponFormPageProps = {
    mode: "create" | "edit";
    couponId?: number;
};

const defaultValues: CouponFormValues = {
    code: "",
    name: "",
    description: "",
    type: "percent",
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    maxUses: 0,
    perUserLimit: 0,
    applyScope: "all",
    applicableProduct: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    status: "active",
    isPublic: true,
};


export default function CouponFormPage({ mode, couponId }: CouponFormPageProps) {
    const navigate = useNavigate();
    const isEdit = mode === "edit";

    const { mutate: createCoupon, isPending: isCreating } = useCreateCoupon();
    const { mutate: updateCoupon, isPending: isUpdating } = useUpdateCoupon();

    const { data: couponDetail, isLoading: isLoadingCoupon } = useCouponById(couponId ?? 0, isEdit);
    const { data: productsData, isLoading: isLoadingProducts } = useProducts({
        page: 1,
        limit: 200,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    const products = productsData?.data ?? [];
    const isPending = isCreating || isUpdating;

    const usedCount = isEdit && couponDetail?.data ? couponDetail.data.usedCount : 0;
    const hasStarted = isEdit && couponDetail?.data ? new Date(couponDetail.data.startDate) <= new Date() : false;

    const schema = useMemo(() => {
        return couponFormSchema.superRefine((values, ctx) => {
            const now = new Date();

            // Only validate startDate in create mode
            if (!isEdit && values.startDate <= now) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["startDate"],
                    message: "Ngày bắt đầu phải lớn hơn thời điểm hiện tại",
                });
            }

            // If editing and endDate is modified, it must be in the future.
            const originalEndDateStr = couponDetail?.data?.endDate;
            const originalEndDate = originalEndDateStr ? new Date(originalEndDateStr) : null;
            const isEndDateChanged = originalEndDate ? values.endDate.getTime() !== originalEndDate.getTime() : true;

            if (isEndDateChanged && values.endDate <= now) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endDate"],
                    message: "Ngày kết thúc phải lớn hơn thời điểm hiện tại",
                });
            }

            if (values.startDate >= values.endDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endDate"],
                    message: "Ngày bắt đầu phải trước ngày kết thúc",
                });
            }

            if (values.type !== "shipping" && values.value <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["value"],
                    message: "Giá trị giảm phải lớn hơn 0",
                });
            }

            if (values.type === "percent" && values.maxDiscountAmount <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["maxDiscountAmount"],
                    message: "Giảm tối đa phải lớn hơn 0 khi loại giảm theo %",
                });
            }

            if (values.applyScope === "product" && !values.applicableProduct) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["applicableProduct"],
                    message: "Vui lòng chọn sản phẩm áp dụng",
                });
            }

            if (isEdit && couponDetail?.data) {
                const currentUsedCount = couponDetail.data.usedCount;
                if (values.maxUses < currentUsedCount) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["maxUses"],
                        message: `Số lượt dùng tối đa không được nhỏ hơn số lượt đã dùng thực tế (${currentUsedCount})`,
                    });
                }
            }
        });
    }, [isEdit, couponDetail]);

    const form = useForm<CouponFormValues>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const selectedType = form.watch("type");
    const selectedScope = form.watch("applyScope");
    const startDate = form.watch("startDate");
    const endDate = form.watch("endDate");

    useEffect(() => {
        if (!couponDetail?.data) {
            return;
        }

        form.reset({
            code: couponDetail.data.code,
            name: couponDetail.data.name ?? "",
            description: couponDetail.data.description ?? "",
            type: couponDetail.data.type,
            value: Number(couponDetail.data.value),
            minOrderAmount: Number(couponDetail.data.minOrderAmount),
            maxDiscountAmount: Number(couponDetail.data.maxDiscountAmount),
            maxUses: Number(couponDetail.data.maxUses),
            perUserLimit: Number(couponDetail.data.perUserLimit),
            applyScope: couponDetail.data.applicableProduct ? "product" : "all",
            applicableProduct: couponDetail.data.applicableProduct
                ? String(couponDetail.data.applicableProduct)
                : "",
            startDate: new Date(couponDetail.data.startDate),
            endDate: new Date(couponDetail.data.endDate),
            status: couponDetail.data.status,
            isPublic: couponDetail.data.isPublic,
        });
    }, [couponDetail, form]);

    useEffect(() => {
        if (selectedType === "shipping") {
            form.setValue("value", 0);
            form.setValue("maxDiscountAmount", 0);
        }

        if (selectedType === "fixed") {
            form.setValue("maxDiscountAmount", 0);
        }
    }, [form, selectedType]);

    const onSubmit = (values: CouponFormValues) => {
        const payload = {
            code: values.code.trim(),
            name: values.name?.trim() || undefined,
            description: values.description?.trim() || undefined,
            type: values.type,
            value: values.type === "shipping" ? 1 : values.value,
            minOrderAmount: values.minOrderAmount,
            maxDiscountAmount: values.type === "percent" ? values.maxDiscountAmount : 0,
            maxUses: values.maxUses,
            perUserLimit: values.perUserLimit,
            applicableProduct:
                values.applyScope === "product" && values.applicableProduct
                    ? Number(values.applicableProduct)
                    : undefined,
            startDate: values.startDate.toISOString(),
            endDate: values.endDate.toISOString(),
            status: values.status,
            isPublic: values.isPublic,
        };

        if (!isEdit) {
            createCoupon(payload, {
                onSuccess: () => {
                    toast.success("Đã tạo mã giảm giá");
                    navigate("/admin/coupons");
                },
                onError: (error) => {
                    toast.error(`Tạo thất bại: ${error.message}`);
                },
            });
            return;
        }

        if (!couponId) {
            toast.error("Không tìm thấy mã giảm giá để cập nhật");
            return;
        }

        updateCoupon(
            { id: couponId, payload },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật mã giảm giá");
                    navigate("/admin/coupons");
                },
                onError: (error) => {
                    toast.error(`Cập nhật thất bại: ${error.message}`);
                },
            }
        );
    };

    if (isEdit && isLoadingCoupon) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tải coupon...
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    {isEdit ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá"}
                </h1>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/coupons")}
                >
                    <ArrowLeft className="size-4" />
                    Quay lại danh sách coupon
                </Button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4">
                <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                    <div className="space-y-4 rounded-md border p-4">
                        <p className="text-sm font-semibold">Thông tin mã giảm giá</p>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mã</label>
                                <Input disabled={isPending || isEdit} {...form.register("code")} />
                                <p className="text-sm text-destructive">{form.formState.errors.code?.message}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tên</label>
                                <Input disabled={isPending} {...form.register("name")} />
                                <p className="text-sm text-destructive">{form.formState.errors.name?.message}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả</label>
                            <Textarea disabled={isPending} {...form.register("description")} />
                            <p className="text-sm text-destructive">{form.formState.errors.description?.message}</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Loại coupon</label>
                                <Select
                                    value={selectedType}
                                    onValueChange={(value) => form.setValue("type", value as CouponType, { shouldValidate: true })}
                                    disabled={isPending || isEdit}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn loại" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {couponTypeOptions.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Trạng thái</label>
                                <Select
                                    value={form.watch("status")}
                                    onValueChange={(value) => form.setValue("status", value as CouponStatus)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {couponStatusOptions.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedType !== "shipping" && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        {selectedType === "percent" ? "Phần trăm giảm" : "Giá trị giảm"}
                                    </label>
                                    <Input
                                        type="number"
                                        disabled={isPending || (isEdit && usedCount > 0)}
                                        {...form.register("value", { valueAsNumber: true })}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        {selectedType === "percent" 
                                            ? "Tỉ lệ phần trăm giảm giá (từ 1 - 100)." 
                                            : "Số tiền giảm trực tiếp vào hóa đơn (ví dụ: 50000)."}
                                    </p>
                                    <p className="text-sm text-destructive">{form.formState.errors.value?.message}</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Đơn tối thiểu</label>
                                    <Input
                                        type="number"
                                        disabled={isPending || (isEdit && usedCount > 0)}
                                        {...form.register("minOrderAmount", { valueAsNumber: true })}
                                    />
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        Giá trị đơn hàng tối thiểu cần đạt để có thể dùng mã này (nhập 0 nếu không yêu cầu).
                                    </p>
                                    <p className="text-sm text-destructive">{form.formState.errors.minOrderAmount?.message}</p>
                                </div>

                                {selectedType === "percent" && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Giảm tối đa</label>
                                        <Input
                                            type="number"
                                            disabled={isPending || (isEdit && usedCount > 0)}
                                            {...form.register("maxDiscountAmount", { valueAsNumber: true })}
                                        />
                                        <p className="text-[11px] text-muted-foreground leading-tight">
                                            Số tiền giảm tối đa của mã này để bảo vệ ngân sách của shop.
                                        </p>
                                        <p className="text-sm text-destructive">{form.formState.errors.maxDiscountAmount?.message}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedType === "shipping" && (
                            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                                Coupon loại miễn phí vận chuyển sẽ tự bỏ qua trường Giá trị giảm và Giảm tối đa.
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ngày bắt đầu</label>
                                <DateTimePicker
                                    value={startDate}
                                    onChange={(value) => {
                                        if (value) {
                                            form.setValue("startDate", value, { shouldValidate: true });
                                        }
                                    }}
                                    disabled={isPending || hasStarted}
                                    placeholder="Chọn ngày bắt đầu"
                                />
                                <p className="text-sm text-destructive">{form.formState.errors.startDate?.message}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Ngày kết thúc</label>
                                <DateTimePicker
                                    value={endDate}
                                    onChange={(value) => {
                                        if (value) {
                                            form.setValue("endDate", value, { shouldValidate: true });
                                        }
                                    }}
                                    disabled={isPending}
                                    placeholder="Chọn ngày kết thúc"
                                />
                                <p className="text-sm text-destructive">{form.formState.errors.endDate?.message}</p>
                            </div>
                        </div>

                        <div className="space-y-2 rounded-md border p-3">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={form.watch("isPublic")}
                                    disabled={isPending}
                                    onCheckedChange={(checked) => form.setValue("isPublic", checked === true)}
                                />
                                <span className="text-sm">Hiển thị public</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight pl-6">
                                Cho phép khách hàng nhìn thấy và thu thập mã này. Nếu tắt, mã sẽ ẩn (chỉ dùng khi gửi mã riêng).
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-md border p-4">
                        <p className="text-sm font-semibold">Thiết lập áp dụng</p>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Số lượt dùng tối đa</label>
                            <Input
                                type="number"
                                disabled={isPending}
                                {...form.register("maxUses", { valueAsNumber: true })}
                            />
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Tổng số lượt mã giảm giá này có thể được sử dụng trên toàn hệ thống.
                            </p>
                            <p className="text-sm text-destructive">{form.formState.errors.maxUses?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Giới hạn mỗi user</label>
                            <Input
                                type="number"
                                disabled={isPending}
                                {...form.register("perUserLimit", { valueAsNumber: true })}
                            />
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                Số lần tối đa mà một tài khoản khách hàng có thể áp dụng mã giảm giá này.
                            </p>
                            <p className="text-sm text-destructive">{form.formState.errors.perUserLimit?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phạm vi áp dụng</label>
                            <Select
                                value={selectedScope}
                                onValueChange={(value) => {
                                    form.setValue("applyScope", value as "all" | "product", {
                                        shouldValidate: true,
                                    });
                                    if (value === "all") {
                                        form.setValue("applicableProduct", "", { shouldValidate: true });
                                    }
                                }}
                                disabled={isPending || (isEdit && usedCount > 0)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn phạm vi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toàn bộ sản phẩm</SelectItem>
                                    <SelectItem value="product">Một sản phẩm cụ thể</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedScope === "product" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sản phẩm áp dụng</label>
                                <Select
                                    value={form.watch("applicableProduct") || ""}
                                    onValueChange={(value) => form.setValue("applicableProduct", value, { shouldValidate: true })}
                                    disabled={isLoadingProducts || isPending || (isEdit && usedCount > 0)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={isLoadingProducts ? "Đang tải sản phẩm..." : "Chọn sản phẩm"}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={String(product.id)}>
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-destructive">{form.formState.errors.applicableProduct?.message}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending
                            ? isEdit
                                ? "Đang cập nhật..."
                                : "Đang tạo..."
                            : isEdit
                                ? "Cập nhật coupon"
                                : "Tạo coupon"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => navigate("/admin/coupons")}
                    >
                        Hủy
                    </Button>
                </div>
            </form>
        </div>
    );
}
