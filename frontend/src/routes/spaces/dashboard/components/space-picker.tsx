import {ChevronsUpDown, Plus} from "lucide-react"
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/components/ui/sidebar.tsx";
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {$spaces} from "@/routes/global-store.ts";
import {$selectedSpace} from "@/routes/global-store.ts";
import {useAtomValue} from "jotai";
import {useNavigate} from "react-router";



function SpacePicker(){
    const { isMobile } = useSidebar()
    const spaces = useAtomValue($spaces)
    const selectedSpace = useAtomValue($selectedSpace)
    const navigate = useNavigate()

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground px-3"
                        >
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {selectedSpace.name}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-sidebar ml-auto "
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel>
                            Пространства
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        {spaces.map((space, index) => (
                            <DropdownMenuItem
                                key={space.id}
                                onClick={() => navigate(`/spaces/${space.id}/dashboard`)}
                                className="gap-2 p-2"
                            >
                                {space.name}

                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => navigate(`/register-space`)}
                            className="gap-2 p-2 flex justify-between"
                        >
                            <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                                <Plus className="size-4" />
                            </div>
                            <div className="text-muted-foreground font-medium">Добавить пространство</div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default SpacePicker