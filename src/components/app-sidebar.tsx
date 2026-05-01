"use client"

import * as React from "react"
import { toast } from "sonner"

import { NavUser } from "@/components/nav-user"
import FShopLogo from "@/components/layout/FShopLogo"
import { useLogout } from "@/hooks/useAuth"
import { useAdminNotificationRealtime, useAdminNotifications } from "@/hooks/useNotifications"
import { authStorage } from "@/lib/auth"
import type { User } from "@/types/user"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  ArchiveRestoreIcon,
  BadgePercentIcon,
  BoxesIcon,
  FolderTreeIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PackageCheckIcon,
  Phone,
  RulerIcon,
  ShieldAlertIcon,
  ShoppingBagIcon,
  TagsIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router"

const logoBrandTheme = {
  "--primary": "#40BFFF",
  "--primary-foreground": "#ffffff",
} as React.CSSProperties

const adminMenuItems = [
  { title: "Bảng điều khiển", url: "/admin/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "Thương hiệu", url: "/admin/brands", icon: <TagsIcon /> },
  { title: "Danh mục", url: "/admin/categories", icon: <FolderTreeIcon /> },
  { title: "Thuộc tính", url: "/admin/attributes", icon: <RulerIcon /> },
  { title: "Đơn hàng", url: "/admin/orders", icon: <ShoppingBagIcon /> },
  { title: "Sản phẩm", url: "/admin/products", icon: <BoxesIcon /> },
  { title: "Người dùng", url: "/admin/users", icon: <UsersIcon /> },
  { title: "Mã giảm giá", url: "/admin/coupons", icon: <BadgePercentIcon /> },
  { title: "Kho hàng", url: "/admin/stocks", icon: <PackageCheckIcon /> },
  { title: "Cộng đồng", url: "/admin/community", icon: <MessageSquareIcon /> },
  { title: "Kiểm duyệt", url: "/admin/moderation", icon: <ShieldAlertIcon /> },
  { title: "Hỗ trợ khách hàng", url: "/admin/support", icon: <Phone /> },
  { title: "Livestream", url: "/admin/livestreams", icon: <VideoIcon /> },
  { title: "Sao lưu & Khôi phục", url: "/admin/backup-restore", icon: <ArchiveRestoreIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const navigate = useNavigate()
  const { mutate: logoutMutation } = useLogout()
  const { data: unreadNotificationsData } = useAdminNotifications({
    page: 1,
    limit: 1,
    isRead: false,
  })

  useAdminNotificationRealtime(true)

  const unreadNotificationCount = unreadNotificationsData?.meta?.pagination?.total ?? 0


  const authUser = authStorage.getUser<User>()
  const sidebarUser = {
    name: authUser?.fullName || authUser?.email || "Người dùng",
    email: authUser?.email || "",
    avatar: authUser?.avatar || "",
  }

  // Chỉ cho admin thấy menu admin
  const isAdmin = authUser?.role === "admin"

  const isItemActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(`${url}/`)
  }

  const handleLogout = () => {
    logoutMutation(undefined, {
      onSettled: () => {
        // Always clear local session even if API logout fails.
        authStorage.clear()
        toast.success("Đã đăng xuất")
        navigate("/login", { replace: true })
      },
    })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 py-1 group-data-[collapsible=icon]:hidden" style={logoBrandTheme}>
          <FShopLogo to="/" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {isAdmin && (
            <>
              <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
              <SidebarMenu className="gap-1">
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isItemActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={sidebarUser}
          onLogout={handleLogout}
          onAccountClick={() => navigate("/admin/profile")}
          onNotificationsClick={() => navigate("/admin/notifications")}
          notificationCount={unreadNotificationCount}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
