
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "../ui/tooltip";
import { AppSidebar } from "../app-sidebar";
import { Outlet } from "react-router";
const AdminLayout = () => {
    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                        </div>
                    </header>
                    <div className="flex flex-1 p-4 pt-0">
                        <Outlet />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
}
export default AdminLayout;