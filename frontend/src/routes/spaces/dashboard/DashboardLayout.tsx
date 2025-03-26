import {Outlet, useOutletContext} from "react-router";
import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import AppSidebar from "@/routes/spaces/dashboard/components/AppSidebar";
import {ApiSpaceModel} from "@/store/spaces.ts";

function DashboardLayout() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[],
        selectedSpace: ApiSpaceModel
    }>()
    return (
        <div>
            <SidebarProvider>
                <AppSidebar spaces={context.spaces} selectedSpace={context.selectedSpace} />
                <main>
                    <Outlet context={context} />
                </main>
            </SidebarProvider>
        </div>
    );
}

export default DashboardLayout
