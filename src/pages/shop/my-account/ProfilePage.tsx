import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, MapPin, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePassword, useMe, useUpdateProfile } from "@/hooks/useAuth";
import { useMyAddresses } from "@/hooks/useAddresses";
import { extractApiErrorMessage } from "@/lib/api-error";
import { authStorage } from "@/lib/auth";

const profileSchema = z.object({
    fullName: z.string().trim().min(1, "Họ và tên là bắt buộc").max(100, "Họ và tên quá dài"),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),
}).refine((values) => values.newPassword === values.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp",
    path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const formatDate = (value?: string) => {
    if (!value) {
        return "--";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "--";
    }

    return new Intl.DateTimeFormat("vi-VN").format(date);
};

const ProfilePage = () => {
    const token = authStorage.getAccessToken();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const { data: meData, isLoading: isProfileLoading, isError: isProfileError } = useMe();
    const { data: addressesData, isLoading: isAddressesLoading } = useMyAddresses();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
    const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
    const profile = meData?.data;
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: "",
        },
    });
    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const defaultAddress = useMemo(() => {
        const items = addressesData?.data ?? [];
        return items.find((address) => address.isDefault) ?? items[0] ?? null;
    }, [addressesData]);

    useEffect(() => {
        if (!profile) {
            return;
        }

        form.reset({
            fullName: profile.fullName ?? "",
        });
    }, [form, profile]);

    useEffect(() => {
        if (!selectedAvatar) {
            setAvatarPreview(null);
            return;
        }

        const nextPreview = URL.createObjectURL(selectedAvatar);
        setAvatarPreview(nextPreview);

        return () => {
            URL.revokeObjectURL(nextPreview);
        };
    }, [selectedAvatar]);

    const addressDisplay = defaultAddress
        ? [defaultAddress.detailAddress, defaultAddress.commune, defaultAddress.district, defaultAddress.province]
            .filter(Boolean)
            .join(", ")
        : "Chưa có địa chỉ mặc định";
    const avatarSrc = avatarPreview || profile?.avatar || undefined;
    const avatarFallback = profile?.fullName?.trim().charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || "U";

    const onSubmit = (values: ProfileFormValues) => {
        if (!profile) {
            return;
        }

        updateProfile(
            {
                fullName: values.fullName.trim(),
                avatar: selectedAvatar ?? undefined,
            },
            {
                onSuccess: (response) => {
                    toast.success("Cập nhật hồ sơ thành công");
                    setSelectedAvatar(null);
                    setAvatarPreview(null);
                    form.reset({
                        fullName: response.data.fullName ?? "",
                    });
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Cập nhật hồ sơ thất bại"));
                },
            }
        );
    };

    const onChangePassword = (values: PasswordFormValues) => {
        changePassword(values, {
            onSuccess: () => {
                toast.success("Đổi mật khẩu thành công");
                passwordForm.reset({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            },
            onError: (error) => {
                toast.error(extractApiErrorMessage(error, "Đổi mật khẩu thất bại"));
            },
        });
    };

    if (!token) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
                <h1 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h1>
                <p className="mt-2 text-sm text-slate-500">Bạn cần đăng nhập để xem và cập nhật hồ sơ.</p>
                <Button asChild className="mt-4">
                    <Link to="/login">Đăng nhập</Link>
                </Button>
            </div>
        );
    }

    if (isProfileLoading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
                Đang tải thông tin hồ sơ...
            </div>
        );
    }

    if (isProfileError || !profile) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
                <h1 className="text-xl font-bold text-slate-900">Không thể tải hồ sơ</h1>
                <p className="mt-2 text-sm text-slate-600">Vui lòng tải lại trang hoặc đăng nhập lại.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h1>
                <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin cơ bản và avatar từ tài khoản hiện tại</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_200px]">
                <form onSubmit={form.handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Họ và tên
                            </label>
                            <div className="relative">
                                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    className="pl-9"
                                    disabled={isUpdating}
                                    {...form.register("fullName")}
                                />
                            </div>
                            <p className="text-sm text-destructive">{form.formState.errors.fullName?.message}</p>
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Email
                            </label>
                            <Input value={profile.email} disabled />
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Tham gia từ
                            </label>
                            <Input
                                value={formatDate(profile.createdAt)}
                                disabled
                            />
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Trạng thái tài khoản
                            </label>
                            <Input
                                value={profile.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                                disabled
                            />
                        </fieldset>

                        <fieldset className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Vai trò
                            </label>
                            <Input
                                value={profile.role}
                                disabled
                            />
                        </fieldset>
                    </div>

                    <fieldset className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Địa chỉ mặc định
                        </label>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                className="pl-9"
                                disabled
                                value={addressDisplay}
                            />
                        </div>
                        <p className="text-xs text-slate-400">
                            {isAddressesLoading
                                ? "Đang tải địa chỉ mặc định..."
                                : "Địa chỉ đang lấy từ địa chỉ mặc định của tài khoản."}
                        </p>
                    </fieldset>

                    <div className="pt-2 flex gap-3">
                        <Button size="sm" type="submit" disabled={isUpdating}>
                            {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                        <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            disabled={isUpdating}
                            onClick={() => {
                                form.reset({
                                    fullName: profile.fullName ?? "",
                                });
                                setSelectedAvatar(null);
                                setAvatarPreview(null);
                            }}
                        >
                            Huỷ
                        </Button>
                    </div>
                </form>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col items-center gap-4">
                    <div className="relative">
                        <Avatar className="size-24">
                            <AvatarImage src={avatarSrc} alt={profile.fullName ?? profile.email} />
                            <AvatarFallback className="bg-primary/10 text-3xl font-semibold text-primary">
                                {avatarFallback}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            type="button"
                            className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-primary text-white shadow hover:bg-primary/90 transition-colors"
                            onClick={() => inputRef.current?.click()}
                        >
                            <Camera className="size-3.5" />
                        </button>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                setSelectedAvatar(file);
                            }}
                        />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-800">{profile.fullName || "Chưa cập nhật tên"}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{profile.email}</p>
                    </div>
                    <p className="text-center text-xs text-slate-400">
                        Dung lượng tối đa 1 MB. Định dạng: JPG, PNG.
                    </p>
                    {selectedAvatar ? (
                        <p className="text-center text-xs text-slate-500">Ảnh mới: {selectedAvatar.name}</p>
                    ) : null}
                </div>
            </div>

            <form
                onSubmit={passwordForm.handleSubmit(onChangePassword)}
                className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
            >
                <div>
                    <h2 className="text-base font-semibold text-slate-900">Đổi mật khẩu</h2>
                    <p className="mt-1 text-sm text-slate-500">Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <fieldset className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Mật khẩu hiện tại
                        </label>
                        <Input
                            type="password"
                            autoComplete="current-password"
                            disabled={isChangingPassword}
                            {...passwordForm.register("currentPassword")}
                        />
                        <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword?.message}</p>
                    </fieldset>

                    <fieldset className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Mật khẩu mới
                        </label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            disabled={isChangingPassword}
                            {...passwordForm.register("newPassword")}
                        />
                        <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword?.message}</p>
                    </fieldset>

                    <fieldset className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Xác nhận mật khẩu mới
                        </label>
                        <Input
                            type="password"
                            autoComplete="new-password"
                            disabled={isChangingPassword}
                            {...passwordForm.register("confirmPassword")}
                        />
                        <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword?.message}</p>
                    </fieldset>
                </div>

                <div className="pt-1 flex gap-3">
                    <Button type="submit" size="sm" disabled={isChangingPassword}>
                        {isChangingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isChangingPassword}
                        onClick={() => {
                            passwordForm.reset({
                                currentPassword: "",
                                newPassword: "",
                                confirmPassword: "",
                            });
                        }}
                    >
                        Huỷ
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;
