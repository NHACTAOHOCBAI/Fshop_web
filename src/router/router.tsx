import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import BackupRestorePage from "@/pages/admin/backup-restore/BackupRestorePage";
import AttributesPage from "@/pages/admin/attributes/AttributesPage";
import BrandsPage from "@/pages/admin/brands/BrandsPage";
import CategoriesPage from "@/pages/admin/categories/CategoriesPage";
import CommunityPage from "@/pages/admin/community/CommunityPage";
import CouponsPage from "@/pages/admin/coupons/CouponsPage";
import DashboardPage from "@/pages/admin/dashboard/DashboardPage";
import LivestreamsPage from "@/pages/admin/livestreams/LivestreamsPage";
import OrdersPage from "@/pages/admin/orders/OrdersPage";
import CreateProductPage from "@/pages/admin/products/CreateProductPage";
import ProductsPage from "@/pages/admin/products/ProductsPage";
import StocksPage from "@/pages/admin/stocks/StocksPage";
import UsersPage from "@/pages/admin/users/UsersPage";
import { createBrowserRouter, Navigate } from "react-router";
import LoginPage from "@/pages/auth/login/LoginPage";
import RegisterPage from "@/pages/auth/register/RegisterPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <RegisterPage />
      </PublicRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "brands",
        element: <BrandsPage />,
      },
      {
        path: "categories",
        element: <CategoriesPage />,
      },
      {
        path: "attributes",
        element: <AttributesPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "products/create",
        element: <CreateProductPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "coupons",
        element: <CouponsPage />,
      },
      {
        path: "stocks",
        element: <StocksPage />,
      },
      {
        path: "community",
        element: <CommunityPage />,
      },
      {
        path: "livestreams",
        element: <LivestreamsPage />,
      },
      {
        path: "backup-restore",
        element: <BackupRestorePage />,
      }
    ]
  }
]);
export default router