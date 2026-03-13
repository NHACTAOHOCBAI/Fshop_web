import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import ClientLayout from "@/components/layout/ClientLayout";
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
import StocksPage from "@/pages/admin/stocks/StocksPage";
import UsersPage from "@/pages/admin/users/UsersPage";
import ProductDetailPage from "@/pages/shop/product-detail/ProductDetailPage";
import CartPage from "@/pages/shop/cart/CartPage";
import { createBrowserRouter, Navigate } from "react-router";
import LoginPage from "@/pages/auth/login/LoginPage";
import RegisterPage from "@/pages/auth/register/RegisterPage";
import ProductsPage from "@/pages/shop/products/ProductsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ClientLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/men" replace />,
      },
      {
        path: ":department",
        element: <ProductsPage />,
      },
      {
        path: ":department/products/:productId",
        element: <ProductDetailPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
    ],
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
      },
    ],
  },
]);

export default router