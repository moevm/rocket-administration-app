import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb.tsx";
import {useAtomValue} from "jotai";
import {
    $selectedSpaceId,
    $selectedUser,
    $selectedUserId,
    $userInfo
} from "@/store/global-store.ts";
import {Link, useParams} from "react-router";
import {Label} from "@/components/ui/label.tsx";
import {loaded} from "@/api";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";
import {useEffect} from "react";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import UserInfoRoomTableView from "@/routes/spaces/dashboard/users/user/Components/UserInfoRoomsTableView.tsx";
import ShortTeamTableView from "@/routes/spaces/dashboard/users/user/Components/ShortTeamTableView.tsx";

function UserPageContent() {
    const user = loaded(useAtomValue($selectedUser)).data
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const {teams, rooms} = loaded(useAtomValue($userInfo)).data

    return (
        <div className="flex flex-col py-6 mx-6">

            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link to={`/spaces/${selectedSpaceId}/dashboard/users`}>
                                Пользователи &gt;
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2">
                <Label className={"text-3xl"}>{user.username}</Label>
                <Card>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3 py-4">
                            <div className="flex justify-between">
                                <Label>id</Label>
                                <Label>{user._id}</Label>
                            </div>
                            <div className="flex justify-between">
                                <Label>Ник</Label>
                                <Label>{user.username}</Label>
                            </div>
                            <div className="flex justify-between">
                                <Label>Email</Label>
                                <Label>{user.emails?.join(', ') ?? '-'}</Label>
                            </div>
                            <div className="flex justify-between">
                                <Label>Статус</Label>
                                <Label>{user.status}</Label>
                            </div>
                            <div className="flex justify-between">
                                <Label>Активен</Label>
                                <Label>{user.active}</Label>
                            </div>
                            <div className="flex justify-between">
                                <Label>Роли</Label>
                                <Label>{user.roles?.join(', ') ?? '-'}</Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className={"flex justify-between gap-6"}>
                    <div className="flex justify-between gap-2">
                        <Button variant="outline">
                            Добавить пользователей
                        </Button>
                        <Button variant="outline">
                            Добавить в команду
                        </Button>
                        <Button variant="outline">
                            Удалить из комнаты
                        </Button>
                        <Button variant="outline">
                            Удалить из команды
                        </Button>
                    </div>
                    <div className="flex justify-between gap-2">
                        <Button variant="outline">
                            Сменить пароль
                        </Button>
                        <Button variant="outline">
                            Удалить
                        </Button>
                    </div>
                </div>
            </div>

            {/*{JSON.stringify({teams, rooms})}*/}
            <UserInfoRoomTableView data={rooms}/>
            <ShortTeamTableView data={teams}/>
            {/*<ShortTeamTableView data={teams} />*/}

        </div>
    )
}

function UserPage() {
    const userId = useParams()['userId']
    const setSelectedUserId = useSetAtom($selectedUserId)
    const selectedUser = useAtomValue($selectedUser)
    const selectedUserInfo = useAtomValue($userInfo)

    useEffect(() => {
        setSelectedUserId(userId!)
    }, [setSelectedUserId, userId]);

    return (
        <BatchLoader
            states={[selectedUser, selectedUserInfo]}
            loadingMessage='Загрузка пользователя'
            display={() => <UserPageContent/>}
        />
    )
}

export default UserPage;