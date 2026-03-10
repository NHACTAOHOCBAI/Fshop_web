import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Controller } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ImageUpload } from "@/components/image-upload/image-upload";
import { useUpdateBrand } from "@/hooks/useBrands";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Brand } from "@/types/brand";

type PreviewFile = File & { preview?: string };

const updateBrandSchema = z.object({
    name: z.string().min(1, "Tên thương hiệu là bắt buộc"),
    description: z.string().optional(),
    image: z.array(z.instanceof(File)).min(1, "Bạn phải chọn một ảnh"),
});

const useLocalUpdateBrand = (
    updatedItem: Brand | undefined,
    closeDialog: () => void
) => {
    const { mutate: updateItem, isPending } = useUpdateBrand();
    const [isImageLoading, setIsImageLoading] = useState(false);

    const form = useForm<z.infer<typeof updateBrandSchema>>({
        resolver: zodResolver(updateBrandSchema),
        defaultValues: {
            name: "",
            description: "",
            image: [],
        },
    });

    const onSubmit = (values: z.infer<typeof updateBrandSchema>) => {
        if (!updatedItem) {
            return;
        }

        updateItem(
            {
                id: updatedItem.id,
                data: {
                    name: values.name,
                    description: values.description,
                    image: values.image[0],
                },
            },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật thương hiệu");
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
        form.reset({ name: "", description: "", image: [] });
        closeDialog();
    };

    const initializeImage = async (item: Brand) => {
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
            description: updatedItem.description ?? "",
            image,
        });
    }, [form, updatedItem]);

    useEffect(() => {
        resetForm();
    }, [resetForm]);

    return {
        form,
        isPending,
        isImageLoading,
        onSubmit,
        handleCancel,
    };
};

interface UpdateBrandDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    updatedItem: Brand | undefined;
    setUpdatedItem: Dispatch<SetStateAction<Brand | undefined>>;
}

export function UpdateBrandDialog({
    open,
    setOpen,
    updatedItem,
    setUpdatedItem,
}: UpdateBrandDialogProps) {
    const closeDialog = () => {
        setOpen(false);
        setUpdatedItem(undefined);
    };

    const { form, isImageLoading, isPending, onSubmit, handleCancel } = useLocalUpdateBrand(
        updatedItem,
        closeDialog
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[96vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cập nhật thương hiệu</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin bên dưới để cập nhật thương hiệu.
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
