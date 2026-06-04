import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useLogin } from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/lib/api-error";
import { authStorage } from "@/lib/auth";

const loginSchema = z.object({
    email: z.email("Email không hợp lệ"),
    password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate: loginMutation, isPending } = useLogin();

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        const state = location.state as { reason?: string } | null;

        if (state?.reason === "forbidden") {
            toast.error("Bạn không có quyền truy cập khu vực quản trị");
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, location.state, navigate]);

    const onSubmit = (values: z.infer<typeof loginSchema>) => {
        loginMutation(
            {
                email: values.email,
                password: values.password,
            },
            {
                onSuccess: (data) => {
                    console.log("Login success:", data);
                    authStorage.setAccessToken(data.accessToken);
                    authStorage.setUser(data.user);
                    toast.success("Đăng nhập thành công");
                    form.reset({ email: "", password: "" });
                    if (data.user.role === "admin") {
                        console.log(data.user.role)
                        console.log("Redirecting to admin dashboard...");
                        navigate("/admin/dashboard", { replace: true });
                    } else {
                        navigate("/", { replace: true });
                    }
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Đăng nhập thất bại"));
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
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Chào mừng trở lại</h1>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                        Hôm nay là ngày mới. Đăng nhập để bắt đầu quản lý hệ thống của bạn.
                    </p>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-9 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ">Email</label>
                            <Input
                                type="email"
                                placeholder="example@email.com"
                                disabled={isPending}
                                {...form.register("email")}
                            />
                            <p className="text-sm text-destructive">{form.formState.errors.email?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium ">Mật khẩu</label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>
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

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full"
                        >
                            {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                        </Button>
                    </form>
                    <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                        <div className="h-px flex-1 bg-slate-300" />
                        Hoặc
                        <div className="h-px flex-1 bg-slate-300" />
                    </div>

                    <GoogleSignInButton
                        onSuccess={() => {
                            navigate("/admin/dashboard", { replace: true });
                        }}
                        disabled={isPending}
                    />

                    <p className="mt-4 text-center text-sm text-slate-600">
                        Chưa có tài khoản?{" "}
                        <Link to="/register" className=" text-blue-600 hover:underline">
                            Đăng ký
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}