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
  { title: "Dashboard", url: "/admin/dashboard", icon: <LayoutDashboardIcon /> },
  { title: "Brands", url: "/admin/brands", icon: <TagsIcon /> },
  { title: "Categories", url: "/admin/categories", icon: <FolderTreeIcon /> },
  { title: "Orders", url: "/admin/orders", icon: <ShoppingBagIcon /> },
  { title: "Products", url: "/admin/products", icon: <BoxesIcon /> },
  { title: "Users", url: "/admin/users", icon: <UsersIcon /> },
  { title: "Coupons", url: "/admin/coupons", icon: <BadgePercentIcon /> },
  { title: "Stocks", url: "/admin/stocks", icon: <PackageCheckIcon /> },
  { title: "Community", url: "/admin/community", icon: <MessageSquareIcon /> },
  { title: "Livestreams", url: "/admin/livestreams", icon: <VideoIcon /> },
  { title: "Backup & Restore", url: "/admin/backup-restore", icon: <ArchiveRestoreIcon /> },
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
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
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
