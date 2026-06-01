import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import AdminLayout from "@/components/layout/AdminLayout";
import ClientLayout from "@/components/layout/ClientLayout";
import BackupRestorePage from "@/pages/admin/backup-restore/BackupRestorePage";
import ModerationDashboard from "@/pages/admin/moderation/ModerationDashboard";
import ModerationQueue from "@/pages/admin/moderation/ModerationQueue";
import AttributesPage from "@/pages/admin/attributes/AttributesPage";
import BrandsPage from "@/pages/admin/brands/BrandsPage";
import CategoriesPage from "@/pages/admin/categories/CategoriesPage";
import AdminCommunityPage from "@/pages/admin/community/CommunityPage";
import SupportInboxPage from "@/pages/admin/support/SupportInboxPage";
import CouponsPage from "@/pages/admin/coupons/CouponsPage";
import CreateCouponPage from "@/pages/admin/coupons/CreateCouponPage";
import DashboardPage from "@/pages/admin/dashboard/DashboardPage";
import EditCouponPage from "@/pages/admin/coupons/EditCouponPage";
import LivestreamsPage from "@/pages/admin/livestreams/LivestreamsPage";
import AdminNotificationsPage from "@/pages/admin/notifications/AdminNotificationsPage";
import OrdersPage from "@/pages/admin/orders/OrdersPage";
import OrderDetailAdminPage from "@/pages/admin/orders/OrderDetailAdminPage";
import ShipmentSimulationPage from "@/pages/admin/orders/ShipmentSimulationPage";
import CreateProductPage from "@/pages/admin/products/CreateProductPage";
import EditProductPage from "@/pages/admin/products/EditProductPage";
import StocksPage from "@/pages/admin/stocks/StocksPage";
import UsersPage from "@/pages/admin/users/UsersPage";
import ProductDetailPage from "@/pages/shop/product-detail/ProductDetailPage";
import ProductTryonPage from "@/pages/shop/product-detail/ProductTryonPage";
import ProductVTO2DPage from "@/pages/shop/product-detail/ProductVTO2DPage";
import CartPage from "@/pages/shop/cart/CartPage";
import CheckoutPage from "@/pages/shop/checkout/CheckoutPage";
import AccountLayout from "@/components/layout/AccountLayout";
import ProfilePage from "@/pages/shop/my-account/ProfilePage";
import AddressesPage from "@/pages/shop/my-account/AddressesPage";
import MyOrdersPage from "@/pages/shop/my-account/MyOrdersPage";
import OrderDetailPage from "@/pages/shop/my-account/OrderDetailPage";
import WishlistsPage from "@/pages/shop/my-account/WishlistsPage";
import NotificationsPage from "@/pages/shop/my-account/NotificationsPage";
import SupportPage from "@/pages/shop/my-account/SupportPage";
import { createBrowserRouter, Navigate } from "react-router";
import LoginPage from "@/pages/auth/login/LoginPage";
import ForgotPasswordPage from "@/pages/auth/forgot-password/ForgotPasswordPage";
import RegisterPage from "@/pages/auth/register/RegisterPage";
import ClientProductsPage from "@/pages/shop/products/ClientProductsPage";
import ProductsPage from "@/pages/admin/products/ProductsPage";
import AdminProfilePage from "@/pages/admin/profile/AdminProfilePage";
import HomePage from "@/pages/shop/home/HomePage";
import CommunityPage from "@/pages/shop/community/CommunityPage";
import LivestreamListPage from "@/pages/shop/livestreams/LivestreamListPage";
import LivestreamDetailPage from "@/pages/shop/livestreams/LivestreamDetailPage";
import PaymentReturnPage from "@/pages/shop/payment/PaymentReturnPage";
import MixMatchPage from "@/pages/shop/mix-match/MixMatchPage";

import UnauthorizedPage from "@/pages/error/UnauthorizedPage";
import NotFoundPage from "@/pages/error/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ClientLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: ":department",
        element: <ClientProductsPage />,
      },
      {
        path: ":department/products/:productId",
        element: <ProductDetailPage />,
      },
      {
        path: ":department/products/:productId/try-on",
        element: <ProductTryonPage />,
      },
      {
        path: ":department/products/:productId/virtual-tryon-2d",
        element: <ProductVTO2DPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "community",
        element: <CommunityPage />,
      },
      {
        path: "mix-match",
        element: <MixMatchPage />,
      },
      {
        path: "community/create",
        element: <CommunityPage />,
      },
      {
        path: "community/:postId",
        element: <CommunityPage />,
      },
      {
        path: "livestreams",
        element: <LivestreamListPage />,
      },
      {
        path: "livestreams/:id",
        element: <LivestreamDetailPage />,
      },
      {
        path: "payment/return",
        element: <PaymentReturnPage />,
      },
      {
        path: "my-account",
        element: <AccountLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="profile" replace />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "addresses",
            element: <AddressesPage />,
          },
          {
            path: "orders",
            element: <MyOrdersPage />,
          },
          {
            path: "orders/:orderId",
            element: <OrderDetailPage />,
          },
          {
            path: "wishlists",
            element: <WishlistsPage />,
          },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
          {
            path: "support",
            element: <SupportPage />,
          },
        ],
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
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <ForgotPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin">
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
        path: "my-account",
        element: (
          <ProtectedRoute requiredRole="user">
            <AccountLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="profile" replace />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "addresses",
            element: <AddressesPage />,
          },
          {
            path: "orders",
            element: <MyOrdersPage />,
          },
          {
            path: "orders/:orderId",
            element: <OrderDetailPage />,
          },
          {
            path: "wishlists",
            element: <WishlistsPage />,
          },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
          {
            path: "support",
            element: <SupportPage />,
          },
        ],
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
        path: "products/:productId/edit",
        element: <EditProductPage />,
      },
      {
        path: "attributes",
        element: <AttributesPage />,
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
        path: "orders/:orderId",
        element: <OrderDetailAdminPage />,
      },
      {
        path: "shipments/simulate",
        element: <ShipmentSimulationPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "profile",
        element: <AdminProfilePage />,
      },
      {
        path: "coupons",
        element: <CouponsPage />,
      },
      {
        path: "coupons/create",
        element: <CreateCouponPage />,
      },
      {
        path: "coupons/:couponId/edit",
        element: <EditCouponPage />,
      },
      {
        path: "stocks",
        element: <StocksPage />,
      },
      {
        path: "community",
        element: <AdminCommunityPage />,
      },
      {
        path: "support",
        element: <SupportInboxPage />,
      },
      {
        path: "livestreams",
        element: <LivestreamsPage />,
      },
      {
        path: "notifications",
        element: <AdminNotificationsPage />,
      },
      {
        path: "backup-restore",
        element: <BackupRestorePage />,
      },
      {
        path: "moderation",
        element: <ModerationDashboard />,
      },
      {
        path: "moderation/queue",
        element: <ModerationQueue />,
      },
    ],
  },
  {
    path: "/401",
    element: <UnauthorizedPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
