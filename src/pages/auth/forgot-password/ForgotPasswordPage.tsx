import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail, Sparkles, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FShopLogo from "@/components/layout/FShopLogo";
import {
  useForgotPasswordRequest,
  useForgotPasswordReset,
  useForgotPasswordVerify,
} from "@/hooks/useAuth";
import { extractApiErrorMessage } from "@/lib/api-error";

const emailSchema = z.object({
  email: z.email("Email không hợp lệ"),
});

const codeSchema = z.object({
  code: z.string().trim().min(6, "Mã xác thực phải có 6 chữ số"),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

const steps = [
  { id: 1, title: "Nhận mã" },
  { id: 2, title: "Xác thực" },
  { id: 3, title: "Đặt lại" },
];

type StepId = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [email, setEmail] = useState("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { mutate: requestForgotPassword, isPending: isRequesting } = useForgotPasswordRequest();
  const { mutate: verifyForgotPassword, isPending: isVerifying } = useForgotPasswordVerify();
  const { mutate: resetForgotPassword, isPending: isResetting } = useForgotPasswordReset();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<z.infer<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSendCode = (values: z.infer<typeof emailSchema>) => {
    requestForgotPassword(
      { email: values.email.trim() },
      {
        onSuccess: (response) => {
          setEmail(values.email.trim());
          setStep(2);
          setVerifiedCode("");
          codeForm.reset({ code: "" });
          passwordForm.reset({ newPassword: "", confirmPassword: "" });
          toast.success(response.warning ?? "Nếu email tồn tại, mã xác thực đã được gửi");
        },
        onError: (error) => {
          toast.error(extractApiErrorMessage(error, "Không thể gửi mã xác thực"));
        },
      }
    );
  };

  const handleVerifyCode = (values: z.infer<typeof codeSchema>) => {
    if (!email) {
      toast.error("Vui lòng nhập email trước");
      return;
    }

    verifyForgotPassword(
      { email, code: values.code.trim() },
      {
        onSuccess: () => {
          setVerifiedCode(values.code.trim());
          setStep(3);
          toast.success("Mã xác thực hợp lệ");
        },
        onError: (error) => {
          setVerifiedCode("");
          toast.error(extractApiErrorMessage(error, "Mã xác thực không hợp lệ"));
        },
      }
    );
  };

  const handleResetPassword = (values: z.infer<typeof passwordSchema>) => {
    if (!email || !verifiedCode) {
      toast.error("Vui lòng xác thực mã trước khi đặt lại mật khẩu");
      return;
    }

    resetForgotPassword(
      {
        email,
        code: verifiedCode,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success("Đặt lại mật khẩu thành công");
          navigate("/login", { replace: true });
        },
        onError: (error) => {
          toast.error(extractApiErrorMessage(error, "Không thể đặt lại mật khẩu"));
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
            <Sparkles className="size-3.5 text-yellow-300" />
            Khôi phục truy cập hệ thống FShop
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
            An toàn và tin cậy tuyệt đối.
          </h2>
          
          <p className="text-white/80 text-sm xl:text-base leading-relaxed">
            Chúng tôi sử dụng quy trình xác minh đa lớp bằng mã OTP qua Email để đảm bảo thông tin cá nhân của bạn được bảo mật tuyệt đối khi lấy lại quyền truy cập tài khoản.
          </p>

          {/* Features checklist */}
          <div className="grid grid-cols-2 gap-4 pt-4 text-white text-xs font-medium">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
              <ShieldCheck className="size-4 text-emerald-300" /> Xác thực mã hóa OTP
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
              <Sparkles className="size-4 text-amber-300" /> Hỗ trợ khách hàng 24/7
            </div>
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="relative z-10 text-white/60 text-xs">
          &copy; 2026 FShop E-commerce System. All rights reserved. Powered by Google AI.
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white relative">
        {/* Background soft gradients for mobile */}
        <div className="lg:hidden absolute -left-24 -top-24 w-80 h-80 rounded-full bg-[#40BFFF]/10 blur-[80px] pointer-events-none" />
        <div className="lg:hidden absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-cyan-100/30 blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-6 relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="size-3.5" />
            Quay lại đăng nhập
          </Link>

          {/* Header showing Logo on Mobile only */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-4 pt-2">
            <div className="lg:hidden inline-block mb-2">
              <FShopLogo className="scale-125" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Khôi phục mật khẩu</h1>
              <p className="mt-2 text-sm text-slate-500">
                Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu mới.
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between gap-2 py-4">
            {steps.map((item) => (
              <div key={item.id} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`grid size-8 place-items-center rounded-full border text-xs font-bold transition-all duration-300 ${
                    step >= item.id
                      ? "border-[#40BFFF] bg-[#40BFFF] text-white"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {step > item.id ? <CheckCircle2 className="size-4" /> : item.id}
                </div>
                <span className={`text-[10px] font-bold ${step >= item.id ? "text-slate-800" : "text-slate-400"}`}>{item.title}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 md:p-8">
              {step === 1 && (
                <form onSubmit={emailForm.handleSubmit(handleSendCode)} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">1. Nhập địa chỉ Email</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Chúng tôi sẽ gửi mã xác thực OTP gồm 6 chữ số tới hòm thư này.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Email</label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        className="h-11 text-sm rounded-xl border-slate-200 pr-10 focus-visible:ring-[#40BFFF]"
                        disabled={isRequesting}
                        {...emailForm.register("email")}
                      />
                      <Mail className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    {emailForm.formState.errors.email?.message && (
                      <p className="text-xs text-rose-500 font-medium">{emailForm.formState.errors.email?.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-xl bg-[#40BFFF] hover:bg-[#32abe6] font-bold text-sm shadow-md" disabled={isRequesting}>
                    {isRequesting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Gửi mã xác thực
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={codeForm.handleSubmit(handleVerifyCode)} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">2. Xác thực mã OTP</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Nhập mã 6 chữ số đã gửi đến <span className="font-semibold text-slate-800">{email}</span>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Mã xác thực OTP</label>
                    <Input
                      inputMode="numeric"
                      placeholder="123456"
                      className="h-11 text-center text-lg tracking-[0.5em] font-extrabold rounded-xl border-slate-200 focus-visible:ring-[#40BFFF]"
                      disabled={isRequesting || isVerifying}
                      {...codeForm.register("code")}
                    />
                    {codeForm.formState.errors.code?.message && (
                      <p className="text-xs text-rose-500 font-medium">{codeForm.formState.errors.code?.message}</p>
                    )}
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setStep(1)} disabled={isRequesting || isVerifying}>
                      Quay lại
                    </Button>
                    <Button type="submit" className="h-11 rounded-xl bg-[#40BFFF] hover:bg-[#32abe6]" disabled={isRequesting || isVerifying}>
                      {isVerifying && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Xác thực
                    </Button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      className="text-xs font-bold text-[#40BFFF] hover:text-[#32abe6] hover:underline"
                      onClick={() => handleSendCode({ email })}
                      disabled={isRequesting || isVerifying || !email}
                    >
                      Gửi lại mã xác thực
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">3. Đặt mật khẩu mới</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Tạo mật khẩu an toàn mới cho tài khoản của bạn.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Mật khẩu mới</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Tối thiểu 6 ký tự"
                        className="h-11 text-sm rounded-xl border-slate-200 pr-10 focus-visible:ring-[#40BFFF]"
                        disabled={isResetting}
                        {...passwordForm.register("newPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword?.message && (
                      <p className="text-xs text-rose-500 font-medium">{passwordForm.formState.errors.newPassword?.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Nhập lại mật khẩu mới"
                        className="h-11 text-sm rounded-xl border-slate-200 pr-10 focus-visible:ring-[#40BFFF]"
                        disabled={isResetting}
                        {...passwordForm.register("confirmPassword")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword?.message && (
                      <p className="text-xs text-rose-500 font-medium">{passwordForm.formState.errors.confirmPassword?.message}</p>
                    )}
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setStep(2)} disabled={isResetting}>
                      Quay lại
                    </Button>
                    <Button type="submit" className="h-11 rounded-xl bg-[#40BFFF] hover:bg-[#32abe6]" disabled={isResetting}>
                      {isResetting && <Loader2 className="mr-2 size-4 animate-spin" />}
                      Hoàn tất
                    </Button>
                  </div>
                </form>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}