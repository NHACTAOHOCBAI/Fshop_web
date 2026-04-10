import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { EyeOff, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/lib/api-error";

const registerSchema = z.object({
    fullName: z.string().min(1, "Họ và tên là bắt buộc"),
    email: z.email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export default function RegisterPage() {
    const navigate = useNavigate();
    const { mutate: registerMutation, isPending } = useRegister();

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof registerSchema>) => {

        registerMutation(
            {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                role: "user",
            },
            {
                onSuccess: () => {
                    toast.success("Đăng ký thành công, vui lòng đăng nhập");
                    form.reset({ fullName: "", email: "", password: "" });
                    navigate("/login", { replace: true });
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Đăng ký thất bại"));
                },
            }
        );
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#e2f0ff_0%,_#f8fbff_38%,_#ffffff_100%)] px-4 py-6 md:px-6">
            <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute -right-24 bottom-14 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl animate-pulse [animation-delay:700ms]" />
            <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tạo tài khoản mới</h1>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                        Hôm nay là ngày mới. Hoàn tất thông tin bên dưới để bắt đầu sử dụng hệ thống.
                    </p>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-9 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Họ và tên</label>
                            <div className="relative">
                                <Input
                                    placeholder="Nguyễn Văn A"
                                    disabled={isPending}
                                    {...form.register("fullName")}
                                />
                                <UserRound className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            </div>
                            <p className="text-sm text-destructive">{form.formState.errors.fullName?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="example@email.com"
                                disabled={isPending}
                                {...form.register("email")}
                            />
                            <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mật khẩu</label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    placeholder="Ít nhất 6 ký tự"
                                    disabled={isPending}
                                    {...form.register("password")}
                                />
                                <EyeOff className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            </div>
                            <p className="text-sm text-destructive">{form.formState.errors.password?.message}</p>
                        </div>

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? "Đang tạo tài khoản..." : "Đăng ký"}
                        </Button>
                    </form>

                    <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                        <div className="h-px flex-1 bg-slate-300" />
                        Hoặc
                        <div className="h-px flex-1 bg-slate-300" />
                    </div>

                    <div>
                        <Button type="button" variant="outline" disabled className="w-full">
                            <span className="grid size-5 place-items-center rounded-full bg-white text-xs font-bold text-red-500">G</span>
                            Đăng ký với Google
                        </Button>
                    </div>

                    <p className="mt-4 text-center text-sm text-slate-600">
                        Đã có tài khoản?{" "}
                        <Link to="/login" className="text-blue-600 hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}