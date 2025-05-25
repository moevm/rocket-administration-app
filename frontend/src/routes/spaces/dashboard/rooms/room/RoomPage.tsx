import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb.tsx";
import {useAtomValue} from "jotai";
import {
    $selectedRoom,
    $selectedSpaceId,
    $selectedRoomId, $roomInfo, $selectedRoomsData, $teams
} from "@/store/global-store.ts";
import {NavLink, useParams} from "react-router";
import {Label} from "@/components/ui/label.tsx";
import {loaded} from "@/api";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";
import {useEffect} from "react";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import EntityCard from "@/components/app/EntityCard.tsx";
import {CheckboxRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import RoomUserTableView from "@/components/app/table/RoomUserTableView.tsx";
import ShortTeamTableView from "@/components/app/table/ShortTeamTableView.tsx";
import {showAddRoomsToUsersDialogAtom} from "@/components/app/dialogs/room-page-dialogs/AddRoomsToUsersDialog.tsx";
import {
    showDeleteUsersOutOfRoomDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteUsersOutOfRoomsDialog.tsx";
import {showAddRoomsToTeamsDialogAtom} from "@/components/app/dialogs/room-page-dialogs/AddTeamsToRoomsDialog.tsx";
import {
    showDeleteTeamsOutOfRoomsDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteTeamsOutOfRoomsDialog.tsx";
import {showHideRoomDialogAtom} from "@/components/app/dialogs/room-page-dialogs/HideRoomDialog.tsx";
import {showDeleteRoomDialogAtom} from "@/components/app/dialogs/room-page-dialogs/DeleteRoomDialog.tsx";

const typesName = {
    d: "Личные сообщения",
    c: "Публичный канал",
    p: "Приватный канал",
    l: "Лайвчат",
    v: "Omnichannel VoIP rooms"
}

function RoomPageContent() {
    const room = loaded(useAtomValue($selectedRoom)).data
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const {team, members} = loaded(useAtomValue($roomInfo)).data

    const teams = team ? team : []

    const setAddRoomToUsersDialogOpen = useSetAtom(showAddRoomsToUsersDialogAtom)
    const setDeleteUsersOutOfRoomDialogOpen = useSetAtom(showDeleteUsersOutOfRoomDialogAtom)
    const setAddTeamsToRoomsDialogOpen = useSetAtom(showAddRoomsToTeamsDialogAtom)
    const setDeleteTeamsOutOfRoomDialogOpen = useSetAtom(showDeleteTeamsOutOfRoomsDialogAtom)
    const setHideRoomDialogOpen = useSetAtom(showHideRoomDialogAtom)
    const setDeleteRoomDialogOpen = useSetAtom(showDeleteRoomDialogAtom)

    const setSelectedRoomsData = useSetAtom($selectedRoomsData)
    const data = [
        {
            _id: room._id as string
        }
    ]
    setSelectedRoomsData(data)

    return (
        <div className="flex flex-col py-6 mx-6">

            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <NavLink to={`/spaces/${selectedSpaceId}/dashboard/rooms`}>
                                Комнаты &gt;
                            </NavLink>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2">
                <Label className={"text-3xl"}>{room.name}</Label>

                <EntityCard
                    items={[
                        ['id', <MonoRenderer value={room._id}/>],
                        ['Описание', <OptRenderer value={room.description}/>],
                        ['Бродкаст', <CheckboxRenderer value={room.broadcast}/>],
                        ['Имя', <OptRenderer value={room.name}/>],
                        ['Тип', typesName[room.t] ?? room.t],
                        ['Сообщения', room.msgs],
                        ['Пользователи', room.usersCount],
                        ['Администратор', <MonoRenderer value={room.u._id} />],
                        ['Read only', <CheckboxRenderer value={room.ro} />],
                        ['Default', <CheckboxRenderer value={room.default} />],
                        ['Тема',  <OptRenderer value={room.topic} />],
                        ['Объявление', <OptRenderer value={room.announcement} />],
                    ]}
                />
                <div className={"flex justify-between gap-6"}>
                    <div className="flex justify-between gap-2">
                        <Button variant="outline" onClick={() => {setAddRoomToUsersDialogOpen(true)}}>
                            Добавить участников
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteUsersOutOfRoomDialogOpen(true)}}>
                            Удалить участников
                        </Button>
                        <Button variant="outline" onClick={() => {setAddTeamsToRoomsDialogOpen(true)}}>
                            Добавить в команды
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteTeamsOutOfRoomDialogOpen(true)}}>
                            Удалить из команды
                        </Button>
                        <Button variant="outline" onClick={() => {setHideRoomDialogOpen(true)}}>
                            Скрыть комнату
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteRoomDialogOpen(true)}}>
                            Удалить комнату
                        </Button>
                    </div>
                </div>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Пользователи</Label>
                <RoomUserTableView data={members}/>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Команды</Label>
                <ShortTeamTableView data={[teams]}/>
            </div>
        </div>
    )
}

function RoomPage() {
    const roomId = useParams()['roomId']
    const setSelectedRoomId = useSetAtom($selectedRoomId)
    const selectedRoom = useAtomValue($selectedRoom)
    const selectedRoomInfo = useAtomValue($roomInfo)

    useEffect(() => {
        setSelectedRoomId(roomId!)
    }, [setSelectedRoomId, roomId]);

    return (
        <BatchLoader
            states={[selectedRoom, selectedRoomInfo]}
            loadingMessage='Загрузка комнаты'
            display={() => <RoomPageContent/>}
        />
    )
}

export default RoomPage;
