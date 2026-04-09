import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, EyeOff, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#e2f0ff_0%,_#f8fbff_38%,_#ffffff_100%)] px-4 py-6 md:px-6">
      <div className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-24 bottom-14 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl animate-pulse [animation-delay:700ms]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900">
            <ArrowLeft className="size-4" />
            Quay lại đăng nhập
          </Link>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Khôi phục mật khẩu</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Làm theo 3 bước để nhận mã xác thực và tạo lại mật khẩu cho tài khoản của bạn.
          </p>

          <div className="mt-7 mb-8 flex items-center justify-between gap-2">
            {steps.map((item) => (
              <div key={item.id} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`grid size-9 place-items-center rounded-full border text-xs font-semibold transition ${
                    step >= item.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {step > item.id ? <CheckCircle2 className="size-4" /> : item.id}
                </div>
                <span className={`text-xs ${step >= item.id ? "text-slate-900" : "text-slate-400"}`}>{item.title}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              {step === 1 && (
                <form onSubmit={emailForm.handleSubmit(handleSendCode)} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Nhập email</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Chúng tôi sẽ gửi mã xác thực tới email này.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        className="pr-10"
                        disabled={isRequesting}
                        {...emailForm.register("email")}
                      />
                      <Mail className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    <p className="text-sm text-destructive">{emailForm.formState.errors.email?.message}</p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isRequesting}>
                    {isRequesting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Gửi mã xác thực
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={codeForm.handleSubmit(handleVerifyCode)} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Xác thực mã</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Nhập mã 6 số đã gửi đến <span className="font-medium text-slate-900">{email}</span>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Mã xác thực</label>
                    <Input
                      inputMode="numeric"
                      placeholder="123456"
                      className="tracking-[0.4em]"
                      disabled={isRequesting || isVerifying}
                      {...codeForm.register("code")}
                    />
                    <p className="text-sm text-destructive">{codeForm.formState.errors.code?.message}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isRequesting || isVerifying}>
                      Quay lại
                    </Button>
                    <Button type="submit" disabled={isRequesting || isVerifying}>
                      {isVerifying ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Xác thực mã
                    </Button>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-medium text-sky-600 hover:underline"
                    onClick={() => handleSendCode({ email })}
                    disabled={isRequesting || isVerifying || !email}
                  >
                    Gửi lại mã
                  </button>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Đặt mật khẩu mới</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Tạo mật khẩu mới cho tài khoản <span className="font-medium text-slate-900">{email}</span>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="Ít nhất 6 ký tự"
                        className="pr-10"
                        disabled={isResetting}
                        {...passwordForm.register("newPassword")}
                      />
                      <EyeOff className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword?.message}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="Nhập lại mật khẩu mới"
                        className="pr-10"
                        disabled={isResetting}
                        {...passwordForm.register("confirmPassword")}
                      />
                      <EyeOff className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword?.message}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={isResetting}>
                      Quay lại
                    </Button>
                    <Button type="submit" disabled={isResetting}>
                      {isResetting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Đặt lại mật khẩu
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Nếu mã không đến, hãy kiểm tra hộp thư rác hoặc quay lại bước đầu để gửi lại mã.
              </div>
            </div>
        </div>
      </div>
    </main>
  );
}