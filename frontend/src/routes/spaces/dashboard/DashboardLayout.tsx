import {Outlet, useOutletContext} from "react-router";
import {SidebarProvider} from "@/components/ui/sidebar.tsx";
import AppSidebar from "@/routes/spaces/dashboard/components/AppSidebar";
import {ApiSpaceModel} from "@/store/global-store.ts";
import PasswordChangeDialog from "@/components/app/dialogs/PasswordChangeDialog.tsx";

function DashboardLayout() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[],
        selectedSpace: ApiSpaceModel
    }>()
    return (
        <>
            <PasswordChangeDialog/>
            <div>
                <SidebarProvider>
                    <AppSidebar spaces={context.spaces} selectedSpace={context.selectedSpace}/>
                    <main>
                        <Outlet context={context}/>
                    </main>
                </SidebarProvider>
            </div>
        </>
    );
}

export default DashboardLayout
