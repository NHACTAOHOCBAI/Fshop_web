import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUpdateSlotType } from "@/hooks/useSlotTypes";
import type { SlotType } from "@/types/category";

const updateSlotTypeSchema = z.object({
    name: z.string().min(1, "Tên là bắt buộc"),
    code: z.string().min(1, "Code là bắt buộc"),
    hint: z.string().optional(),
});

interface UpdateSlotTypeDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
    updatedItem: SlotType | undefined;
    setUpdatedItem: Dispatch<SetStateAction<SlotType | undefined>>;
}

export function UpdateSlotTypeDialog({
    open,
    setOpen,
    updatedItem,
    setUpdatedItem,
}: UpdateSlotTypeDialogProps) {
    const { mutate: updateItem, isPending } = useUpdateSlotType();

    const closeDialog = () => {
        setOpen(false);
        setUpdatedItem(undefined);
    };

    const form = useForm<z.infer<typeof updateSlotTypeSchema>>({
        resolver: zodResolver(updateSlotTypeSchema),
        defaultValues: {
            name: "",
            code: "",
            hint: "",
        },
    });

    const onSubmit = (values: z.infer<typeof updateSlotTypeSchema>) => {
        if (!updatedItem) return;

        updateItem(
            {
                id: updatedItem.id,
                data: {
                    name: values.name,
                    code: values.code,
                    hint: values.hint || undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật vị trí phối đồ");
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
        form.reset({ name: "", code: "", hint: "" });
        closeDialog();
    };

    const resetForm = useCallback(() => {
        if (!updatedItem) return;
        form.reset({
            name: updatedItem.name,
            code: updatedItem.code,
            hint: updatedItem.hint ?? "",
        });
    }, [form, updatedItem]);

    useEffect(() => {
        resetForm();
    }, [resetForm]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[calc(100vw-1rem)] max-h-[96vh] overflow-y-auto sm:max-w-md sm:w-full">
                <DialogHeader>
                    <DialogTitle>Cập nhật Vị trí phối đồ</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin bên dưới để cập nhật vị trí phối đồ.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên hiển thị</label>
                        <Input disabled={isPending} {...form.register("name")} />
                        <p className="text-sm text-destructive">{form.formState.errors.name?.message}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Code</label>
                        <Input disabled={isPending} {...form.register("code")} />
                        <p className="text-sm text-destructive">{form.formState.errors.code?.message}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Gợi ý</label>
                        <Input disabled={isPending} {...form.register("hint")} />
                        <p className="text-sm text-destructive">{form.formState.errors.hint?.message}</p>
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
            </DialogContent>
        </Dialog>
    );
}
