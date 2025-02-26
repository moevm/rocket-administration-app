import { Outlet } from "react-router";
import {SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar.tsx";
import AppSidebar from "@/routes/spaces/dashboard/components/app-sidebar.tsx";
import {useAtomValue} from "jotai";
import {$selectedSpace} from "@/routes/global-store.ts";

function DashboardLayout() {
    const selectedSpace = useAtomValue($selectedSpace)
    return (
        <div>
            <SidebarProvider>
                <AppSidebar />
                <main>
                    {JSON.stringify(selectedSpace)}
                    <Outlet />
                </main>
            </SidebarProvider>
        </div>
    );
}

export default DashboardLayout