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
import {Link, NavLink, useParams} from "react-router";
import {Label} from "@/components/ui/label.tsx";
import {loaded} from "@/api";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";
import {useEffect} from "react";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import UserInfoRoomTableView from "@/routes/spaces/dashboard/users/user/Components/UserInfoRoomsTableView.tsx";
import ShortTeamTableView from "@/routes/spaces/dashboard/users/user/Components/ShortTeamTableView.tsx";
import EntityCard from "@/components/app/EntityCard.tsx";
import {ListRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";

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
                            <NavLink to={`/spaces/${selectedSpaceId}/dashboard/users`}>
                                Пользователи &gt;
                            </NavLink>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2">
                <Label className={"text-3xl"}>{user.username}</Label>

                <EntityCard
                    items={[
                        ['id', <MonoRenderer value={user._id} />],
                        ['Ник', user.username],
                        ['Email', <ListRenderer value={user.emails?.map(it => it.address)} />],
                        ['Статус', user.status],
                        ['Активен', <OptRenderer value={user.active} />],
                        ['Роли', <ListRenderer value={user.roles} />],
                    ]}
                />
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
            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Комнаты</Label>
                <UserInfoRoomTableView data={rooms}/>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Команды</Label>
                <ShortTeamTableView data={teams}/>
            </div>
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
