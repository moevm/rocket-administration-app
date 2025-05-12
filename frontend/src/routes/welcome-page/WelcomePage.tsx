import {Label} from "@/components/ui/label.tsx";
import {Button} from "@/components/ui/button.tsx";
import {NavLink, useNavigate} from "react-router";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {useAtomValue} from "jotai/index";
import {$spaces} from "@/store/global-store.ts";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {loaded} from "@/api";


function WelcomePage() {
    const spaces = useAtomValue($spaces)
    const navigate = useNavigate()

    return (
        <div className={"flex items-center justify-center min-h-screen flex-col gap-3 m-2"}>
            <Label className={"text-2xl"}>
                Добро пожаловать в <span className={"text-primary"}>RocketManager</span>
            </Label>
            <BatchLoader
                states={[spaces]}
                loadingMessage={"Загрузка..."}
                display={() =>
                    loaded(spaces).data.length === 0
                        ?
                        <Label className={"text-foreground/60"}>
                            Приступим к настройке вашего первого пространства
                        </Label>
                        :
                        <div className="flex flex-col">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary">
                                        Существующие пространства
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-sidebar ml-auto "
                                    align="start"
                                >
                                    {
                                        loaded(spaces).data.map((space) => (
                                            <DropdownMenuItem
                                                key={space._id}
                                                onClick={() => navigate(`/spaces/${space._id}/dashboard`)}
                                                className="gap-2 p-2 cursor-pointer"
                                            >
                                                {space.name}
                                            </DropdownMenuItem>
                                        ))
                                    }
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                }/>
            <Button>
                <NavLink to="/register-space">
                    Регистрация пространства
                </NavLink>
            </Button>
        </div>

    )
}

export default WelcomePage
