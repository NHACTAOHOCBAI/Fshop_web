import type { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    //     const token = authStorage.getAccessToken();
    // const user = authStorage.getUser<User>();
    // if (!token || !user) {
    //     return <Navigate to="/login" replace />;
    // }

    // if (user.role !== "admin") {
    //     return <Navigate to="/login" replace state={{ reason: "forbidden" }} />;
    // }

    return <>{children}</>;
}
