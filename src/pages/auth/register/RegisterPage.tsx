import { useState } from "react";

import axios from "axios";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/useAuth";

export default function RegisterPage() {
    const navigate = useNavigate();
    const { mutate: registerMutation, isPending } = useRegister();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        registerMutation(
            {
                fullName,
                email,
                password,
                role: "user",
            },
            {
                onSuccess: () => {
                    toast.success("Đăng ký thành công, vui lòng đăng nhập");
                    navigate("/login", { replace: true });
                },
                onError: (error) => {
                    if (axios.isAxiosError(error)) {
                        const errorData = error.response?.data as { message?: string | string[] };
                        const message = Array.isArray(errorData?.message)
                            ? errorData.message[0]
                            : errorData?.message || "Đăng ký thất bại";
                        toast.error(message);
                        return;
                    }
                    toast.error("Đăng ký thất bại");
                },
            }
        );
    };

    return (
        <main className="min-h-screen bg-linear-to-b from-amber-50 to-orange-100 px-4 py-12">
            <div className="mx-auto w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold">Đăng ký</h1>
                <p className="mt-1 text-sm text-muted-foreground">Tạo tài khoản mới cho FShop</p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Họ và tên</label>
                        <Input
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Nguyen Van A"
                            required
                            disabled={isPending}
                        />
                    </div>

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
                            placeholder="Tối thiểu 6 ký tự"
                            minLength={6}
                            required
                            disabled={isPending}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                    </Button>
                </form>

                <p className="mt-4 text-sm text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </main>
    );
}