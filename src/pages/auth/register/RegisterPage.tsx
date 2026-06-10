import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, UserRound, Sparkles, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FShopLogo from "@/components/layout/FShopLogo";
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
    const [showPassword, setShowPassword] = useState(false);

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
                        Gia nhập cộng đồng thời trang FShop
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                        Kiến tạo phong cách riêng của bạn.
                    </h2>

                    <p className="text-white/80 text-sm xl:text-base leading-relaxed">
                        Chỉ với vài thao tác đơn giản, đăng ký tài khoản mới để bắt đầu trải nghiệm mua sắm không giới hạn, lưu sản phẩm yêu thích và trải nghiệm thử đồ ảo bằng trí tuệ nhân tạo (AI).
                    </p>

                    {/* Features checklist */}
                    <div className="grid grid-cols-2 gap-4 pt-4 text-white text-xs font-medium">
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                            <ShieldCheck className="size-4 text-emerald-300" /> Nhận ưu đãi độc quyền
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
                            <Sparkles className="size-4 text-amber-300" /> Lưu trữ tủ đồ thông minh
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
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Đăng ký tài khoản</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Tạo tài khoản FShop mới để bắt đầu mua sắm ngay hôm nay.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Họ và tên</label>
                            <div className="relative">
                                <Input
                                    placeholder="Nguyễn Văn A"
                                    className="h-11 text-sm rounded-xl border-slate-200 focus-visible:ring-[#40BFFF] pr-10 transition-all duration-200"
                                    disabled={isPending}
                                    {...form.register("fullName")}
                                />
                                <UserRound className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            </div>
                            {form.formState.errors.fullName?.message && (
                                <p className="text-xs text-rose-500 font-medium">{form.formState.errors.fullName?.message}</p>
                            )}
                        </div>

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
                            <label className="text-xs font-semibold text-slate-600">Mật khẩu</label>
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
                            {isPending ? "Đang đăng ký..." : "Đăng ký tài khoản"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-500 font-medium">
                        Bạn đã có tài khoản rồi?{" "}
                        <Link to="/login" className="font-bold text-[#40BFFF] hover:text-[#32abe6] hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}