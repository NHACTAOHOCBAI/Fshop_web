import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCreateSlotType } from "@/hooks/useSlotTypes";

const createSlotTypeSchema = z.object({
    name: z.string().min(1, "Tên là bắt buộc"),
    code: z.string().min(1, "Code là bắt buộc"),
    hint: z.string().optional(),
});

interface CreateSlotTypeDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function CreateSlotTypeDialog({ open, setOpen }: CreateSlotTypeDialogProps) {
    const { mutate: createItem, isPending } = useCreateSlotType();

    const form = useForm<z.infer<typeof createSlotTypeSchema>>({
        resolver: zodResolver(createSlotTypeSchema),
        defaultValues: {
            name: "",
            code: "",
            hint: "",
        },
    });

    const onSubmit = (values: z.infer<typeof createSlotTypeSchema>) => {
        createItem(
            {
                name: values.name,
                code: values.code,
                hint: values.hint || undefined,
            },
            {
                onSuccess: () => {
                    toast.success("Đã tạo slot type");
                },
                onError: (error) => {
                    toast.error(`Tạo thất bại: ${error.message}`);
                },
                onSettled: () => {
                    form.reset({ name: "", code: "", hint: "" });
                    setOpen(false);
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset({ name: "", code: "", hint: "" });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[calc(100vw-1rem)] max-h-[96vh] overflow-y-auto sm:max-w-md sm:w-full">
                <DialogHeader>
                    <DialogTitle>Thêm Slot Type</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin bên dưới để tạo vị trí phối đồ mới.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên hiển thị</label>
                        <Input disabled={isPending} placeholder="Ví dụ: Áo" {...form.register("name")} />
                        <p className="text-sm text-destructive">{form.formState.errors.name?.message}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Code</label>
                        <Input disabled={isPending} placeholder="Ví dụ: top" {...form.register("code")} />
                        <p className="text-sm text-destructive">{form.formState.errors.code?.message}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Gợi ý</label>
                        <Input disabled={isPending} placeholder="Ví dụ: Áo thun, sơ mi, áo khoác" {...form.register("hint")} />
                        <p className="text-sm text-destructive">{form.formState.errors.hint?.message}</p>
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
