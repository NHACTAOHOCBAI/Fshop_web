
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "../ui/tooltip";
import { AppSidebar } from "../app-sidebar";
import type { CSSProperties } from "react";
import { Outlet } from "react-router";

const adminTheme = {
    "--primary": "oklch(0.205 0 0)",
    "--primary-foreground": "oklch(0.985 0 0)",
} as CSSProperties;

const AdminLayout = () => {
    return (
        <TooltipProvider>
            <SidebarProvider style={adminTheme}>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-14 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:h-16">
                        <div className="flex items-center gap-2 px-3 sm:px-4">
                            <SidebarTrigger className="-ml-1" />
                        </div>
                    </header>
                    <div className="flex w-full flex-1 overflow-x-hidden px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
                        <div className="min-w-0 w-full flex-1">
                            <Outlet />
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
export default AdminLayout;