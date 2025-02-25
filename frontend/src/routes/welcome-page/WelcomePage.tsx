import {Label} from "@/components/ui/label.tsx";
import {Button} from "@/components/ui/button.tsx";
import {NavLink} from "react-router";


function WelcomePage () {

    return (
        <div className={"flex items-center justify-center min-h-screen flex-col gap-3 m-2"}>
            <Label className={"text-2xl"}>
                Добро пожаловать в <span className={"text-primary"}>RocketManager</span>
            </Label>
            <Label className={"text-foreground/60"}>
                Приступим к настройке вашего первого пространства
            </Label>
            <Button>
                <NavLink to="/register-space">
                    Регистрация пространства
                </NavLink>
            </Button>
        </div>

    )

}

export default WelcomePage