import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCreateUser } from "@/hooks/useUsers";

const roleOptions = ["admin", "user"] as const;

const roleLabelMap: Record<(typeof roleOptions)[number], string> = {
    admin: "Quản trị viên",
    user: "Người dùng",
};

const createUserSchema = z.object({
    fullName: z.string().min(1, "Họ và tên là bắt buộc"),
    email: z.email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    role: z.enum(roleOptions, { error: "Vai trò là bắt buộc" }),
    avatar: z.array(z.instanceof(File)).max(1, "Chỉ được chọn 1 ảnh đại diện"),
});

interface CreateUserDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function CreateUserDialog({ open, setOpen }: CreateUserDialogProps) {
    const { mutate: createItem, isPending } = useCreateUser();

    const form = useForm<z.infer<typeof createUserSchema>>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            role: "user",
            avatar: [],
        },
    });

    const onSubmit = (values: z.infer<typeof createUserSchema>) => {
        createItem(
            {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                role: values.role,
                avatar: values.avatar[0],
            },
            {
                onSuccess: () => {
                    toast.success("Đã tạo người dùng");
                },
                onError: (error) => {
                    toast.error(`Tạo thất bại: ${error.message}`);
                },
                onSettled: () => {
                    form.reset({
                        fullName: "",
                        email: "",
                        password: "",
                        role: "user",
                        avatar: [],
                    });
                    setOpen(false);
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset({
            fullName: "",
            email: "",
            password: "",
            role: "user",
            avatar: [],
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[96vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thêm người dùng</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin bên dưới để tạo người dùng mới.
                    </DialogDescription>
                </DialogHeader>

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
                        <label className="text-sm font-medium">Mật khẩu</label>
                        <Input type="password" disabled={isPending} {...form.register("password")} />
                        <p className="text-sm text-destructive">{form.formState.errors.password?.message}</p>
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
                            {isPending ? "Đang tạo..." : "Tạo"}
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
            </DialogContent>
        </Dialog>
    );
}
