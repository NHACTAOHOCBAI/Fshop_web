import AmdinLayout from "@/components/layout/AdminLayout";
import BrandsPage from "@/pages/admin/brands/BrandsPage";
import CategoriesPage from "@/pages/admin/categories/CategoriesPage";
import CouponsPage from "@/pages/admin/coupons/CouponsPage";
import DashboardPage from "@/pages/admin/dashboard/DashboardPage";
import OrdersPage from "@/pages/admin/orders/OrdersPage";
import ProductsPage from "@/pages/admin/products/ProductsPage";
import StocksPage from "@/pages/admin/stocks/StocksPage";
import UsersPage from "@/pages/admin/users/UsersPage";
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  {
    path: "/admin",
    element: <AmdinLayout />,
    children: [
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
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
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
      }
    ]
  }
]);
export default router