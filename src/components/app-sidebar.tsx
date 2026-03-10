"use client"

import * as React from "react"
import { toast } from "sonner"

import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useLogout } from "@/hooks/useAuth"
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
  AudioLinesIcon,
  BadgePercentIcon,
  BoxesIcon,
  FolderTreeIcon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  PackageCheckIcon,
  RulerIcon,
  ShoppingBagIcon,
  TagsIcon,
  TerminalIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
}

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
  { title: "Livestream", url: "/admin/livestreams", icon: <VideoIcon /> },
  { title: "Sao lưu & Khôi phục", url: "/admin/backup-restore", icon: <ArchiveRestoreIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const navigate = useNavigate()
  const { mutate: logoutMutation } = useLogout()

  const authUser = authStorage.getUser<User>()
  const sidebarUser = {
    name: authUser?.fullName || authUser?.email || "Người dùng",
    email: authUser?.email || "",
    avatar: authUser?.avatar || "",
  }

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
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
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
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
