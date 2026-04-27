import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { authStorage } from "@/lib/auth";
import type { User } from "@/types/user";

interface PublicRouteProps {
    children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
    const token = authStorage.getAccessToken();
    const user = authStorage.getUser<User>();
    // Nếu đã đăng nhập, chuyển hướng phù hợp
    if (token && user?.role === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
    }
    if (token && user?.role === "user") {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
