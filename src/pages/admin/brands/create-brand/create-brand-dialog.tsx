import { Controller } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";

import useLocalCreateBrand from "./use-local-create-brand";

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
                    <DialogTitle>Add Brand</DialogTitle>
                    <DialogDescription>
                        Enter brand information below to add a new brand.
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
