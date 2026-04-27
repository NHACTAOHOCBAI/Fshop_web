import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { authStorage } from "@/lib/auth";
import type { User, RoleType } from "@/types/user";
import UnauthorizedPage from "@/pages/error/UnauthorizedPage";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: RoleType; // optional, default: any logged in
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const location = useLocation();
    const token = authStorage.getAccessToken();
    const user = authStorage.getUser<User>();

    if (!token || !user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (requiredRole && user.role !== requiredRole) {
        // Nếu không đúng role, hiển thị trang 401
        return <UnauthorizedPage />;
    }

    return <>{children}</>;
}
