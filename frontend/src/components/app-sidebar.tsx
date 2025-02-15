import {Sidebar, SidebarContent, SidebarHeader} from "@/components/ui/sidebar"
import {Button} from "@/components/ui/button.tsx";
import {SpacePicker} from "@/components/space-picker.tsx";


export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <SpacePicker/>
            </SidebarHeader>
            <SidebarContent />
        </Sidebar>
    )
}
