import { zodResolver } from "@hookform/resolvers/zod";
import { Home, MapPinHouse, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useCreateAddress,
    useDeleteAddress,
    useMyAddresses,
    useSetDefaultAddress,
    useUpdateAddress,
} from "@/hooks/useAddresses";
import { useDistricts, useProvinces, useWards } from "@/hooks/useLocations";
import { extractApiErrorMessage } from "@/lib/api-error";
import type { Address, AddressType, UpsertAddressPayload } from "@/types/address";

const ADDRESS_TYPES: { value: AddressType; label: string }[] = [
    { value: "home", label: "Nhà" },
    { value: "work", label: "Cơ quan" },
    { value: "other", label: "Khác" },
];

const addressSchema = z.object({
    recipientName: z.string().trim().min(1, "Tên người nhận là bắt buộc"),
    recipientPhone: z.string().trim().min(1, "Số điện thoại là bắt buộc"),
    detailAddress: z.string().trim().min(1, "Địa chỉ chi tiết là bắt buộc"),
    province: z.string().trim().min(1, "Tỉnh/Thành là bắt buộc"),
    district: z.string().trim().min(1, "Quận/Huyện là bắt buộc"),
    commune: z.string().trim().min(1, "Phường/Xã là bắt buộc"),
    type: z.enum(["home", "work", "other"]),
    isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const defaultValues: AddressFormValues = {
    recipientName: "",
    recipientPhone: "",
    detailAddress: "",
    province: "",
    district: "",
    commune: "",
    type: "home",
    isDefault: false,
};

const formatAddressLine = (address: Address) =>
    [address.detailAddress, address.commune, address.district, address.province]
        .filter(Boolean)
        .join(", ");

const AddressesPage = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const { data, isLoading } = useMyAddresses();
    const { mutate: createAddress, isPending: isCreatingAddress } = useCreateAddress();
    const { mutate: updateAddress, isPending: isUpdatingAddress } = useUpdateAddress();
    const { mutate: deleteAddress, isPending: isDeletingAddress } = useDeleteAddress();
    const { mutate: setDefaultAddress, isPending: isSettingDefault } = useSetDefaultAddress();

    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues,
    });
    const selectedType = form.watch("type");
    const isDefaultChecked = form.watch("isDefault");
    const selectedProvince = form.watch("province");
    const selectedDistrict = form.watch("district");

    const { data: provinces = [], isLoading: isLoadingProvinces } = useProvinces();
    const selectedProvinceCode = provinces.find((item) => item.name === selectedProvince)?.code ?? null;
    const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(selectedProvinceCode);
    const selectedDistrictCode = districts.find((item) => item.name === selectedDistrict)?.code ?? null;
    const { data: wards = [], isLoading: isLoadingWards } = useWards(selectedDistrictCode);

    const addresses = useMemo(() => data?.data ?? [], [data]);

    const isMutating = isCreatingAddress || isUpdatingAddress || isDeletingAddress || isSettingDefault;

    const startCreate = () => {
        setEditingAddressId(null);
        setIsCreating(true);
        form.reset(defaultValues);
    };

    const startEdit = (address: Address) => {
        setIsCreating(false);
        setEditingAddressId(address.id);
        form.reset({
            recipientName: address.recipientName,
            recipientPhone: address.recipientPhone,
            detailAddress: address.detailAddress,
            province: address.province,
            district: address.district,
            commune: address.commune,
            type: address.type,
            isDefault: address.isDefault,
        });
    };

    const cancelForm = () => {
        setIsCreating(false);
        setEditingAddressId(null);
        form.reset(defaultValues);
    };

    const onSubmit = (values: AddressFormValues) => {
        const payload: UpsertAddressPayload = {
            recipientName: values.recipientName.trim(),
            recipientPhone: values.recipientPhone.trim(),
            detailAddress: values.detailAddress.trim(),
            province: values.province.trim(),
            district: values.district.trim(),
            commune: values.commune.trim(),
            type: values.type,
            isDefault: values.isDefault,
        };

        if (editingAddressId) {
            updateAddress(
                { id: editingAddressId, payload },
                {
                    onSuccess: () => {
                        toast.success("Cập nhật địa chỉ thành công");
                        cancelForm();
                    },
                    onError: (error) => {
                        toast.error(extractApiErrorMessage(error, "Cập nhật địa chỉ thất bại"));
                    },
                }
            );
            return;
        }

        createAddress(payload, {
            onSuccess: () => {
                toast.success("Thêm địa chỉ thành công");
                cancelForm();
            },
            onError: (error) => {
                toast.error(extractApiErrorMessage(error, "Thêm địa chỉ thất bại"));
            },
        });
    };

    const handleDelete = (id: number) => {
        deleteAddress(id, {
            onSuccess: () => {
                toast.success("Đã xóa địa chỉ");
                if (editingAddressId === id) {
                    cancelForm();
                }
            },
            onError: (error) => {
                toast.error(extractApiErrorMessage(error, "Xóa địa chỉ thất bại"));
            },
        });
    };

    const handleSetDefault = (id: number) => {
        setDefaultAddress(id, {
            onSuccess: () => {
                toast.success("Đã đặt làm địa chỉ mặc định");
            },
            onError: (error) => {
                toast.error(extractApiErrorMessage(error, "Đặt địa chỉ mặc định thất bại"));
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Địa chỉ của tôi</h1>
                    <p className="mt-1 text-sm text-slate-500">Quản lý địa chỉ giao hàng cho đơn hàng của bạn</p>
                </div>
                <Button size="sm" onClick={startCreate} disabled={isMutating || isCreating}>
                    <Plus className="mr-1.5 size-4" />
                    Thêm địa chỉ
                </Button>
            </div>

            {(isCreating || editingAddressId !== null) ? (
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
                >
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-slate-900">
                            {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                        </h2>
                        <Button type="button" variant="outline" size="sm" onClick={cancelForm} disabled={isMutating}>
                            Huỷ
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Người nhận</label>
                            <Input disabled={isMutating} {...form.register("recipientName")} />
                            <p className="text-sm text-destructive">{form.formState.errors.recipientName?.message}</p>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Số điện thoại</label>
                            <Input disabled={isMutating} {...form.register("recipientPhone")} />
                            <p className="text-sm text-destructive">{form.formState.errors.recipientPhone?.message}</p>
                        </fieldset>

                        <fieldset className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Địa chỉ chi tiết</label>
                            <Input disabled={isMutating} {...form.register("detailAddress")} />
                            <p className="text-sm text-destructive">{form.formState.errors.detailAddress?.message}</p>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tỉnh/Thành</label>
                            <Select
                                value={selectedProvince}
                                onValueChange={(value) => {
                                    form.setValue("province", value, { shouldDirty: true, shouldValidate: true });
                                    form.setValue("district", "", { shouldDirty: true, shouldValidate: true });
                                    form.setValue("commune", "", { shouldDirty: true, shouldValidate: true });
                                }}
                                disabled={isMutating || isLoadingProvinces}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={isLoadingProvinces ? "Đang tải tỉnh/thành..." : "Chọn tỉnh/thành"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {provinces.map((item) => (
                                        <SelectItem key={item.code} value={item.name}>{item.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-destructive">{form.formState.errors.province?.message}</p>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quận/Huyện</label>
                            <Select
                                value={selectedDistrict}
                                onValueChange={(value) => {
                                    form.setValue("district", value, { shouldDirty: true, shouldValidate: true });
                                    form.setValue("commune", "", { shouldDirty: true, shouldValidate: true });
                                }}
                                disabled={isMutating || !selectedProvinceCode || isLoadingDistricts}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            !selectedProvinceCode
                                                ? "Chọn tỉnh/thành trước"
                                                : isLoadingDistricts
                                                    ? "Đang tải quận/huyện..."
                                                    : "Chọn quận/huyện"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {districts.map((item) => (
                                        <SelectItem key={item.code} value={item.name}>{item.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-destructive">{form.formState.errors.district?.message}</p>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phường/Xã</label>
                            <Select
                                value={form.watch("commune")}
                                onValueChange={(value) => {
                                    form.setValue("commune", value, { shouldDirty: true, shouldValidate: true });
                                }}
                                disabled={isMutating || !selectedDistrictCode || isLoadingWards}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            !selectedDistrictCode
                                                ? "Chọn quận/huyện trước"
                                                : isLoadingWards
                                                    ? "Đang tải phường/xã..."
                                                    : "Chọn phường/xã"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {wards.map((item) => (
                                        <SelectItem key={item.code} value={item.name}>{item.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-destructive">{form.formState.errors.commune?.message}</p>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Loại địa chỉ</label>
                            <Select
                                value={selectedType}
                                onValueChange={(value) => form.setValue("type", value as AddressType, { shouldDirty: true })}
                                disabled={isMutating}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn loại địa chỉ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ADDRESS_TYPES.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </fieldset>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <Checkbox
                            checked={isDefaultChecked}
                            disabled={isMutating}
                            onCheckedChange={(checked) => {
                                form.setValue("isDefault", checked === true, { shouldDirty: true });
                            }}
                        />
                        <span>Đặt làm địa chỉ mặc định</span>
                    </label>

                    <div className="pt-2">
                        <Button type="submit" size="sm" disabled={isMutating}>
                            {isMutating ? "Đang lưu..." : (editingAddressId ? "Lưu cập nhật" : "Thêm địa chỉ")}
                        </Button>
                    </div>
                </form>
            ) : null}

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                    Đang tải danh sách địa chỉ...
                </div>
            ) : addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                    <MapPinHouse className="mx-auto size-9 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ giao hàng đầu tiên.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {addresses.map((address) => (
                        <article key={address.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">{address.recipientName}</p>
                                        <span className="text-xs text-slate-500">{address.recipientPhone}</span>
                                        {address.isDefault ? (
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                Mặc định
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="text-sm text-slate-600">{formatAddressLine(address)}</p>
                                    <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                                        <Home className="size-3.5" />
                                        {ADDRESS_TYPES.find((item) => item.value === address.type)?.label ?? "Khác"}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    {!address.isDefault ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={isMutating}
                                            onClick={() => handleSetDefault(address.id)}
                                        >
                                            <Star className="mr-1 size-3.5" />
                                            Đặt mặc định
                                        </Button>
                                    ) : null}
                                    <Button size="sm" variant="outline" disabled={isMutating} onClick={() => startEdit(address)}>
                                        <Pencil className="mr-1 size-3.5" />
                                        Sửa
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={isMutating} onClick={() => handleDelete(address.id)}>
                                        <Trash2 className="mr-1 size-3.5" />
                                        Xoá
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AddressesPage;
