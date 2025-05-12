import {Sidebar, SidebarContent, SidebarGroup, SidebarHeader} from "@/components/ui/sidebar.tsx"
import {Button} from "@/components/ui/button.tsx";
import {LucideRocket, Mail, SettingsIcon, User, Users} from "lucide-react";
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
                <Button variant="ghost" asChild className="justify-start text-xl font-bold px-2">
                    <NavLink to="/">
                        <LucideRocket className={"text-primary !size-6 animate-pulse"}/>RocketManager
                    </NavLink>
                </Button>
                <SpacePicker spaces={props.spaces} selectedSpace={props.selectedSpace}/>
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
                        <NavLink to="teams">
                            <Users/> Команды
                        </NavLink>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start px-3">
                        <NavLink to="notifications">
                            <SettingsIcon/> Настройки
                        </NavLink>
                    </Button>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

export default AppSidebar
