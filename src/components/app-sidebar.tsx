"use client"

import * as React from "react"

import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
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
import { Link, useLocation } from "react-router"

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

  const isItemActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(`${url}/`)
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
