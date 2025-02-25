import {Label} from "@/components/ui/label.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {Navigate, NavLink} from "react-router";
import {User} from "lucide-react";


function WelcomePage () {

    return (
        <div className={"flex items-center justify-center min-h-screen"}>
            <Card>
                <CardHeader className={"flex justify-center text-center"}>
                    <Label>
                        Добро пожаловать! <br/> Создайте свое первое пространство
                    </Label>
                </CardHeader>
                <CardContent className={"flex justify-center"}>
                    <Button>
                        <NavLink to="/register-space">
                            Клик!
                        </NavLink>
                    </Button>
                </CardContent>
            </Card>
        </div>

    )

}

export default WelcomePage