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
    $selectedUserId, $selectedUsersData,
    $userInfo
} from "@/store/global-store.ts";
import {NavLink, useParams} from "react-router";
import {Label} from "@/components/ui/label.tsx";
import {loaded} from "@/api";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";
import {useEffect} from "react";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import UserInfoRoomTableView from "@/components/app/table/UserInfoRoomTableView.tsx";
import ShortTeamTableView from "@/components/app/table/ShortTeamTableView.tsx";
import EntityCard from "@/components/app/EntityCard.tsx";
import {ListRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import {showPasswordChangeDialogAtom} from "@/components/app/dialogs/user-page-dialogs/PasswordChangeDialog.tsx";
import {showAddUserInRoomDialogAtom} from "@/components/app/dialogs/user-page-dialogs/AddUserInRoomDialog.tsx";
import {showAddUserInTeamDialogAtom} from "@/components/app/dialogs/user-page-dialogs/AddUserInTeamDialog.tsx";
import {showDeleteUserFromRoomDialogAtom} from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromRoomDialog.tsx";
import {showDeleteUserFromTeamDialogAtom} from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromTeamDialog.tsx";
import {showDeleteUserDialogAtom} from "@/components/app/dialogs/user-page-dialogs/DeleteUserDialog.tsx";

function UserPageContent() {
    const user = loaded(useAtomValue($selectedUser)).data
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const {teams, rooms} = loaded(useAtomValue($userInfo)).data

    const setPasswordChangeDialogOpen = useSetAtom(showPasswordChangeDialogAtom)
    const setAddUserInRoomOpen = useSetAtom(showAddUserInRoomDialogAtom)
    const setAddUserInTeamOpen = useSetAtom(showAddUserInTeamDialogAtom)
    const setDeleteUserFromRoomOpen = useSetAtom(showDeleteUserFromRoomDialogAtom)
    const setDeleteUserFromTeamOpen = useSetAtom(showDeleteUserFromTeamDialogAtom)
    const setDeleteUserOpen = useSetAtom(showDeleteUserDialogAtom)

    const setSelectedUsersData = useSetAtom($selectedUsersData)
    const data = [
        {
            _id: user._id as string,
            username: user.username as string
        }
    ]
    setSelectedUsersData(data)

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
                        ['id', <MonoRenderer value={user._id}/>],
                        ['Никнейм', user.username],
                        ['Email', <ListRenderer value={user.emails?.map(it => it.address)}/>],
                        ['Статус', user.status],
                        ['Роли', <ListRenderer value={user.roles}/>],
                        ['Активен', <OptRenderer value={user.active}/>],
                        ['Тип', user.type],
                    ]}
                />
                <div className={"flex justify-between gap-6"}>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => {setAddUserInRoomOpen(true)}}>
                            Добавить в комнату
                        </Button>
                        <Button variant="outline" onClick={() => {setAddUserInTeamOpen(true)}}>
                            Добавить в команду
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteUserFromTeamOpen(true)}}>
                            Удалить из команды
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteUserFromRoomOpen(true)}}>
                            Удалить из комнаты
                        </Button>
                        <Button variant="outline" onClick={() => {setPasswordChangeDialogOpen(true)}}>
                            Сменить пароль
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteUserOpen(true)}}>
                            Удалить
                        </Button>
                    </div>
                </div>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Комнаты</Label>
                <UserInfoRoomTableView data={rooms}/>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Команды</Label>
                <ShortTeamTableView data={teams}/>
            </div>
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
