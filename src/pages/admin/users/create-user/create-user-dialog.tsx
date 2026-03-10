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

const createUserSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.email("Email is invalid"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(roleOptions, { error: "Role is required" }),
    avatar: z.array(z.instanceof(File)).max(1, "Only one avatar is allowed"),
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
                    toast.success("User has been created");
                },
                onError: (error) => {
                    toast.error(`Create failed: ${error.message}`);
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
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>
                        Enter user information below to add a new user.
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
                        <label className="text-sm font-medium">Password</label>
                        <Input type="password" disabled={isPending} {...form.register("password")} />
                        <p className="text-sm text-destructive">{form.formState.errors.password?.message}</p>
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
