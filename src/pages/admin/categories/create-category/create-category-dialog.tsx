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
import { Textarea } from "@/components/ui/textarea";
import { useCreateCategory } from "@/hooks/useCategories";

const departmentOptions = ["men", "women", "kids"] as const;

const createCategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    department: z.enum(departmentOptions, {
        error: "Department is required",
    }),
    description: z.string().optional(),
    image: z.array(z.instanceof(File)).min(1, "You must choose an image"),
});

interface CreateCategoryDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function CreateCategoryDialog({ open, setOpen }: CreateCategoryDialogProps) {
    const { mutate: createItem, isPending } = useCreateCategory();

    const form = useForm<z.infer<typeof createCategorySchema>>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            name: "",
            department: undefined,
            description: "",
            image: [],
        },
    });

    const onSubmit = (values: z.infer<typeof createCategorySchema>) => {
        createItem(
            {
                name: values.name,
                department: values.department,
                description: values.description,
                image: values.image[0],
            },
            {
                onSuccess: () => {
                    toast.success("Category has been created");
                },
                onError: (error) => {
                    toast.error(`Create failed: ${error.message}`);
                },
                onSettled: () => {
                    form.reset({ name: "", department: undefined, description: "", image: [] });
                    setOpen(false);
                },
            }
        );
    };

    const handleCancel = () => {
        form.reset({ name: "", department: undefined, description: "", image: [] });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[96vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Category</DialogTitle>
                    <DialogDescription>
                        Enter category information below to add a new category.
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
                                label="Upload Image"
                                disabled={isPending}
                                error={fieldState.error?.message}
                            />
                        )}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input disabled={isPending} {...form.register("name")} />
                        <p className="text-sm text-destructive">{form.formState.errors.name?.message}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Department</label>
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
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departmentOptions.map((department) => (
                                            <SelectItem key={department} value={department}>
                                                {department.toUpperCase()}
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
                        <label className="text-sm font-medium">Description</label>
                        <Textarea disabled={isPending} {...form.register("description")} />
                        <p className="text-sm text-destructive">{form.formState.errors.description?.message}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button disabled={isPending} type="submit" className="w-full">
                            {isPending ? "Creating..." : "Create"}
                        </Button>
                        <Button
                            disabled={isPending}
                            type="button"
                            onClick={handleCancel}
                            variant="outline"
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
