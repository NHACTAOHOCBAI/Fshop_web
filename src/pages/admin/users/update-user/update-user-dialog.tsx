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

const updateUserSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Email is invalid"),
    role: z.enum(roleOptions, { error: "Role is required" }),
    avatar: z.array(z.instanceof(File)).max(1, "Only one avatar is allowed"),
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
                    toast.success("User has been updated");
                },
                onError: (error) => {
                    toast.error(`Update failed: ${error.message}`);
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
                    <DialogTitle>Update User</DialogTitle>
                    <DialogDescription>
                        Enter user information below to update this user.
                    </DialogDescription>
                </DialogHeader>

                {isImageLoading ? (
                    <p className="text-sm text-muted-foreground">Loading avatar...</p>
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
                                    label="Upload Avatar"
                                    disabled={isPending}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input disabled={isPending} {...form.register("fullName")} />
                            <p className="text-sm text-destructive">{form.formState.errors.fullName?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" disabled={isPending} {...form.register("email")} />
                            <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
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
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roleOptions.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role.toUpperCase()}
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
                                {isPending ? "Updating..." : "Update"}
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
                )}
            </DialogContent>
        </Dialog>
    );
}
