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
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCategory } from "@/hooks/useCategories";
import type { Category } from "@/types/category";

type PreviewFile = File & { preview?: string };

const departmentOptions = ["men", "women", "kids"] as const;

const departmentLabelMap: Record<(typeof departmentOptions)[number], string> = {
    men: "Nam",
    women: "Nữ",
    kids: "Trẻ em",
};

const updateCategorySchema = z.object({
    name: z.string().min(1, "Tên danh mục là bắt buộc"),
    department: z.enum(departmentOptions, {
        error: "Phân khu là bắt buộc",
    }),
    description: z.string().optional(),
    image: z.array(z.instanceof(File)).min(1, "Bạn phải chọn một ảnh"),
});

interface UpdateCategoryDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    updatedItem: Category | undefined;
    setUpdatedItem: Dispatch<SetStateAction<Category | undefined>>;
}

export function UpdateCategoryDialog({
    open,
    setOpen,
    updatedItem,
    setUpdatedItem,
}: UpdateCategoryDialogProps) {
    const { mutate: updateItem, isPending } = useUpdateCategory();
    const [isImageLoading, setIsImageLoading] = useState(false);

    const closeDialog = () => {
        setOpen(false);
        setUpdatedItem(undefined);
    };

    const form = useForm<z.infer<typeof updateCategorySchema>>({
        resolver: zodResolver(updateCategorySchema),
        defaultValues: {
            name: "",
            department: undefined,
            description: "",
            image: [],
        },
    });

    const onSubmit = (values: z.infer<typeof updateCategorySchema>) => {
        if (!updatedItem) {
            return;
        }

        updateItem(
            {
                id: updatedItem.id,
                data: {
                    name: values.name,
                    department: values.department,
                    description: values.description,
                    image: values.image[0],
                },
            },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật danh mục");
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
        form.reset({ name: "", department: undefined, description: "", image: [] });
        closeDialog();
    };

    const initializeImage = async (item: Category) => {
        if (!item.imageUrl) {
            return [] as File[];
        }

        setIsImageLoading(true);
        const response = await fetch(item.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "image", { type: blob.type }) as PreviewFile;
        file.preview = item.imageUrl;
        setIsImageLoading(false);

        return [file] as File[];
    };

    const resetForm = useCallback(async () => {
        if (!updatedItem) {
            return;
        }

        const image = await initializeImage(updatedItem);
        form.reset({
            name: updatedItem.name,
            department: updatedItem.department,
            description: updatedItem.description ?? "",
            image,
        });
    }, [form, updatedItem]);

    useEffect(() => {
        resetForm();
    }, [resetForm]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[96vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cập nhật danh mục</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin bên dưới để cập nhật danh mục.
                    </DialogDescription>
                </DialogHeader>

                {isImageLoading ? (
                    <p className="text-sm text-muted-foreground">Đang tải ảnh...</p>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <Controller
                            control={form.control}
                            name="image"
                            render={({ field, fieldState }) => (
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    numOfImage={1}
                                    label="Tải ảnh lên"
                                    disabled={isPending}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tên</label>
                            <Input disabled={isPending} {...form.register("name")} />
                            <p className="text-sm text-destructive">{form.formState.errors.name?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phân khu</label>
                            <Controller
                                control={form.control}
                                name="department"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn phân khu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departmentOptions.map((department) => (
                                                <SelectItem key={department} value={department}>
                                                    {departmentLabelMap[department]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            <p className="text-sm text-destructive">
                                {form.formState.errors.department?.message}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả</label>
                            <Textarea disabled={isPending} {...form.register("description")} />
                            <p className="text-sm text-destructive">{form.formState.errors.description?.message}</p>
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
