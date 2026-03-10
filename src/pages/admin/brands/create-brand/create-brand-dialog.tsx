import { zodResolver } from "@hookform/resolvers/zod";
import { Controller } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ImageUpload } from "@/components/image-upload/image-upload";
import { useCreateBrand } from "@/hooks/useBrands";
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

const createBrandSchema = z.object({
    name: z.string().min(1, "Tên thương hiệu là bắt buộc"),
    description: z.string().optional(),
    image: z.array(z.instanceof(File)).min(1, "Bạn phải chọn một ảnh"),
});

const useLocalCreateBrand = (closeDialog: () => void) => {
    const { mutate: createItem, isPending } = useCreateBrand();

    const form = useForm<z.infer<typeof createBrandSchema>>({
        resolver: zodResolver(createBrandSchema),
        defaultValues: {
            name: "",
            description: "",
            image: [],
        },
    });

    const onSubmit = (values: z.infer<typeof createBrandSchema>) => {
        createItem(
            {
                name: values.name,
                description: values.description,
                image: values.image[0],
            },
            {
                onSuccess: () => {
                    toast.success("Đã tạo thương hiệu");
                },
                onError: (error) => {
                    toast.error(`Tạo thất bại: ${error.message}`);
                },
                onSettled: () => {
                    form.reset({ name: "", description: "", image: [] });
                    closeDialog();
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset({ name: "", description: "", image: [] });
        closeDialog();
    };

    return {
        form,
        isPending,
        onSubmit,
        handleCancel,
    };
};

interface CreateBrandDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function CreateBrandDialog({ open, setOpen }: CreateBrandDialogProps) {
    const { form, handleCancel, isPending, onSubmit } = useLocalCreateBrand(() => setOpen(false));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[96vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thêm thương hiệu</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin thương hiệu bên dưới để tạo mới.
                    </DialogDescription>
                </DialogHeader>

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
