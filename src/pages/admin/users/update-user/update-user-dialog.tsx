import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ImageUpload } from "@/components/image-upload/image-upload";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUpdateUser } from "@/hooks/useUsers";
import type { User } from "@/types/user";

type PreviewFile = File & { preview?: string };

const roleOptions = ["admin", "user"] as const;

const roleLabelMap: Record<(typeof roleOptions)[number], string> = {
    admin: "Quản trị viên",
    user: "Người dùng",
};

const updateUserSchema = z.object({
    fullName: z.string().min(1, "Họ và tên là bắt buộc"),
    email: z.email("Email không hợp lệ"),
    role: z.enum(roleOptions, { error: "Vai trò là bắt buộc" }),
    avatar: z.array(z.instanceof(File)).max(1, "Chỉ được chọn 1 ảnh đại diện"),
});

interface UpdateUserDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    updatedItem: User | undefined;
    setUpdatedItem: Dispatch<SetStateAction<User | undefined>>;
}

export function UpdateUserDialog({
    open,
    setOpen,
    updatedItem,
    setUpdatedItem,
}: UpdateUserDialogProps) {
    const { mutate: updateItem, isPending } = useUpdateUser();
    const [isImageLoading, setIsImageLoading] = useState(false);

    const closeDialog = () => {
        setOpen(false);
        setUpdatedItem(undefined);
    };

    const form = useForm<z.infer<typeof updateUserSchema>>({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            fullName: "",
            email: "",
            role: "user",
            avatar: [],
        },
    });

    const onSubmit = (values: z.infer<typeof updateUserSchema>) => {
        if (!updatedItem) {
            return;
        }

        updateItem(
            {
                id: updatedItem.id,
                data: {
                    fullName: values.fullName,
                    email: values.email,
                    role: values.role,
                    avatar: values.avatar[0],
                },
            },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật người dùng");
                },
                onError: (error) => {
                    toast.error(`Cập nhật thất bại: ${error.message}`);
                },
                onSettled: () => {
                    handleCancel();
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset({ fullName: "", email: "", role: "user", avatar: [] });
        closeDialog();
    };

    const initializeImage = async (item: User) => {
        if (!item.avatar) {
            return [] as File[];
        }

        setIsImageLoading(true);
        const response = await fetch(item.avatar);
        const blob = await response.blob();
        const file = new File([blob], "avatar", { type: blob.type }) as PreviewFile;
        file.preview = item.avatar;
        setIsImageLoading(false);

        return [file] as File[];
    };

    const resetForm = useCallback(async () => {
        if (!updatedItem) {
            return;
        }

        const avatar = await initializeImage(updatedItem);
        form.reset({
            fullName: updatedItem.fullName || "",
            email: updatedItem.email,
            role: updatedItem.role,
            avatar,
        });
    }, [form, updatedItem]);

    useEffect(() => {
        resetForm();
    }, [resetForm]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[96vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cập nhật người dùng</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin bên dưới để cập nhật người dùng.
                    </DialogDescription>
                </DialogHeader>

                {isImageLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải ảnh đại diện...</p>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Controller
                            control={form.control}
                            name="avatar"
                            render={({ field, fieldState }) => (
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    numOfImage={1}
                                    label="Tải ảnh đại diện"
                                    disabled={isPending}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Họ và tên</label>
                            <Input disabled={isPending} {...form.register("fullName")} />
                            <p className="text-sm text-destructive">{form.formState.errors.fullName?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" disabled={isPending} {...form.register("email")} />
                            <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Vai trò</label>
                            <Controller
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn vai trò" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {roleLabelMap[role]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <p className="text-sm text-destructive">{form.formState.errors.role?.message}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button disabled={isPending} type="submit" className="w-full">
                                {isPending ? "Đang cập nhật..." : "Cập nhật"}
                            </Button>
                            <Button
                                disabled={isPending}
                                type="button"
                                onClick={handleCancel}
                                variant="outline"
                                className="w-full"
                            >
                                Hủy
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
