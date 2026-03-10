import { useEffect, useState } from "react";

import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/hooks/useAuth";
import { authStorage } from "@/lib/auth";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { mutate: loginMutation, isPending } = useLogin();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const state = location.state as { reason?: string } | null;

        if (state?.reason === "forbidden") {
            toast.error("Bạn không có quyền truy cập khu vực quản trị");
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, location.state, navigate]);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        loginMutation(
            {
                email,
                password,
            },
            {
                onSuccess: (data) => {
                    authStorage.setAccessToken(data.accessToken);
                    authStorage.setUser(data.user);
                    toast.success("Đăng nhập thành công");
                    navigate("/admin/dashboard", { replace: true });
                },
                onError: (error) => {
                    if (axios.isAxiosError(error)) {
                        const message =
                            (error.response?.data as { message?: string })?.message ||
                            "Đăng nhập thất bại";
                        toast.error(message);
                        return;
                    }
                    toast.error("Đăng nhập thất bại");
                },
            }
        );
    };

    return (
        <main className="min-h-screen bg-linear-to-b from-slate-100 to-slate-200 px-4 py-12">
            <div className="mx-auto w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold">Đăng nhập</h1>
                <p className="mt-1 text-sm text-muted-foreground">Đăng nhập vào hệ thống FShop</p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mật khẩu</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Nhập mật khẩu"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                </form>

                <p className="mt-4 text-sm text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                        Đăng ký
                    </Link>
                </p>
            </div>
        </main>
    );
}