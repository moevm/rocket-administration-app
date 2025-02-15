import { Outlet } from "react-router";
import {Sidebar, SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import {AppSidebar} from "@/components/app-sidebar.tsx";

function DashboardLayout() {
    return (
        <div>
            <SidebarProvider>
                <AppSidebar />
                <main>
                    <SidebarTrigger/>
                    <Outlet />
                </main>
            </SidebarProvider>
        </div>
    );
}

export default DashboardLayout