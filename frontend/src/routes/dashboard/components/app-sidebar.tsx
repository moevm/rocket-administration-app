import {Sidebar, SidebarContent, SidebarGroup, SidebarHeader} from "@/components/ui/sidebar"
import {Button} from "@/components/ui/button.tsx";
import {Mail, User, Users} from "lucide-react";
import SpacePicker from "@/routes/dashboard/components/space-picker.tsx";
import {NavLink} from "react-router";


function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <SpacePicker/>
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