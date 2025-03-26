import {Sidebar, SidebarContent, SidebarGroup, SidebarHeader} from "@/components/ui/sidebar.tsx"
import {Button} from "@/components/ui/button.tsx";
import {Mail, User, Users} from "lucide-react";
import SpacePicker from "@/routes/spaces/dashboard/components/SpacePicker.tsx";
import {NavLink} from "react-router";
import {ApiSpaceModel} from "@/store/global-store.ts";


function AppSidebar(props: {
    selectedSpace: ApiSpaceModel,
    spaces: ApiSpaceModel[]
}) {
    return (
        <Sidebar>
            <SidebarHeader>
                <SpacePicker spaces={props.spaces} selectedSpace={props.selectedSpace} />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <Button asChild variant="ghost" className="justify-start px-3">
                        <NavLink to="users">
                            <User/> Пользователи
                        </NavLink>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start px-3">
                        <NavLink to="rooms">
                            <Users/> Комнаты
                        </NavLink>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start px-3">
                        <NavLink to="notifications">
                            <Mail/> Уведомления
                        </NavLink>
                    </Button>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

export default AppSidebar
