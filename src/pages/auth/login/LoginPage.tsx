import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import FShopLogo from "@/components/layout/FShopLogo";
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
    const [showPassword, setShowPassword] = useState(false);

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
        <main className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50">
            {/* Left Column: Visual Branding/Mockup (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#40BFFF] overflow-hidden p-12 flex-col justify-between">
                {/* Visual Decorative Background Blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#40BFFF]/30 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-sky-300/20 blur-[100px] animate-pulse [animation-delay:1000ms]" />

                {/* Top Branding Section */}
                <div className="relative z-10 flex items-center gap-3">
                    <FShopLogo className="scale-150 origin-left" />
                </div>

                {/* Main Slogan and Highlights */}
                <div className="relative z-10 my-auto max-w-lg space-y-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs font-semibold tracking-wide">
                        Trải nghiệm thử đồ AR / 2D AI thông minh
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                        Định hình phong cách thời trang thế hệ mới.
                    </h2>

                    <p className="text-white/80 text-sm xl:text-base leading-relaxed">
                        Hãy đăng nhập ngay để đồng bộ giỏ hàng, nhận khuyến mãi đặc quyền và sử dụng các tính năng thử trang phục bằng công nghệ trí tuệ nhân tạo (AI) đột phá của FShop.
                    </p>

                    {/* Features checklist */}
                    <div className="grid grid-cols-2 gap-4 pt-4 text-white text-xs font-medium">
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                            <ShieldCheck className="size-4 text-emerald-300" /> Bảo mật thông tin tối đa
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                            <Sparkles className="size-4 text-amber-300" /> Đề xuất phối đồ thông minh
                        </div>
                    </div>
                </div>

                {/* Bottom Footer Section */}
                <div className="relative z-10 text-white/60 text-xs">
                    &copy; 2026 FShop E-commerce System. All rights reserved.
                </div>
            </div>

            {/* Right Column: Form Container */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white relative">
                {/* Background soft gradients for mobile */}
                <div className="lg:hidden absolute -left-24 -top-24 w-80 h-80 rounded-full bg-[#40BFFF]/10 blur-[80px] pointer-events-none" />
                <div className="lg:hidden absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-cyan-100/30 blur-[80px] pointer-events-none" />

                <div className="w-full max-w-[420px] space-y-8 relative z-10">
                    {/* Header showing Logo on Mobile only */}
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-4">
                        <div className="lg:hidden inline-block mb-2">
                            <FShopLogo className="scale-125" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Chào mừng trở lại</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Đăng nhập để tiếp tục quản lý và mua sắm trên FShop.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Địa chỉ Email</label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                className="h-11 text-sm rounded-xl border-slate-200 focus-visible:ring-[#40BFFF] transition-all duration-200"
                                disabled={isPending}
                                {...form.register("email")}
                            />
                            {form.formState.errors.email?.message && (
                                <p className="text-xs text-rose-500 font-medium">{form.formState.errors.email?.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-600">Mật khẩu</label>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-semibold text-[#40BFFF] hover:text-[#32abe6] transition-colors"
                                >
                                    Quên mật khẩu?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Tối thiểu 6 ký tự"
                                    className="h-11 text-sm rounded-xl border-slate-200 pr-10 focus-visible:ring-[#40BFFF] transition-all duration-200"
                                    disabled={isPending}
                                    {...form.register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                                </button>
                            </div>
                            {form.formState.errors.password?.message && (
                                <p className="text-xs text-rose-500 font-medium">{form.formState.errors.password?.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-11 rounded-xl bg-[#40BFFF] hover:bg-[#32abe6] text-white font-bold text-sm shadow-lg shadow-sky-200/50 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-1.5"
                        >
                            {isPending ? "Đang xử lý..." : "Đăng nhập ngay"}
                        </Button>
                    </form>

                    <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
                        <div className="h-px flex-1 bg-slate-100" />
                        <span className="font-medium">Hoặc tiếp tục với</span>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    <div className="flex justify-center">
                        <GoogleSignInButton
                            onSuccess={() => {
                                navigate("/", { replace: true });
                            }}
                            disabled={isPending}
                        />
                    </div>

                    <p className="mt-8 text-center text-xs text-slate-500 font-medium">
                        Bạn chưa có tài khoản?{" "}
                        <Link to="/register" className="font-bold text-[#40BFFF] hover:text-[#32abe6] hover:underline">
                            Đăng ký tài khoản mới
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}