import type { ReactNode } from "react";

interface PublicRouteProps {
    children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
    //  const token = authStorage.getAccessToken();
    // const user = authStorage.getUser<User>();
    // if (token && user?.role === "admin") {
    //     return <Navigate to="/admin/dashboard" replace />;
    // }

    return <>{children}</>;
}
