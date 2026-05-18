import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb.tsx";
import {useAtomValue} from "jotai";
import {
    $prefetchedDeleteUsersOutOfRoomSmallUsers,
    $selectedRoom,
    $selectedSpaceId,
    $selectedRoomId, $roomInfo, $selectedRoomsData,
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
import {RoomReactWhenReadOnlySetting} from "@/components/app/RoomReactWhenReadOnlySetting.tsx";
import {showEditRoomDialogAtom} from "@/components/app/dialogs/room-page-dialogs/EditRoomDialog.tsx";
import EditRoomDialog from "@/components/app/dialogs/room-page-dialogs/EditRoomDialog.tsx";
import {Pencil} from "lucide-react";

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
    const {team, members, reactWhenReadOnly} = loaded(useAtomValue($roomInfo)).data

    const teams = team ? team : []

    const setAddRoomToUsersDialogOpen = useSetAtom(showAddRoomsToUsersDialogAtom)
    const setDeleteUsersOutOfRoomDialogOpen = useSetAtom(showDeleteUsersOutOfRoomDialogAtom)
    const setAddTeamsToRoomsDialogOpen = useSetAtom(showAddRoomsToTeamsDialogAtom)
    const setDeleteTeamsOutOfRoomDialogOpen = useSetAtom(showDeleteTeamsOutOfRoomsDialogAtom)
    const setHideRoomDialogOpen = useSetAtom(showHideRoomDialogAtom)
    const setDeleteRoomDialogOpen = useSetAtom(showDeleteRoomDialogAtom)
    const setEditRoomDialogOpen = useSetAtom(showEditRoomDialogAtom);

    const setSelectedRoomsData = useSetAtom($selectedRoomsData)
    const setPrefetchedDeleteUsersSmall = useSetAtom($prefetchedDeleteUsersOutOfRoomSmallUsers)
    const data = [
        {
            _id: room._id as string,
            name: room.name as string
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
                        ['Создатель', room.u?._id ? ( <NavLink to={`/spaces/${selectedSpaceId}/dashboard/users/${room.u._id}`} className="text-blue-600 hover:underline" > {room.u.name ?? room.u.username ?? room.u._id} </NavLink> ) : ( <span>-</span> )],
                        ['Read only', <CheckboxRenderer value={room.ro} />],
                        [
                            'Реакции при read-only',
                            <RoomReactWhenReadOnlySetting
                                spaceId={selectedSpaceId}
                                roomId={room._id}
                                value={reactWhenReadOnly}
                            />,
                        ],
                        ['Default', <CheckboxRenderer value={room.default} />],
                        ['Тема',  <OptRenderer value={room.topic} />],
                        ['Объявление', <OptRenderer value={room.announcement} />],
                    ]}
                />
                <div className={"flex justify-between gap-6"}>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => {setAddRoomToUsersDialogOpen(true)}}>
                            Добавить участников
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setPrefetchedDeleteUsersSmall([...(members ?? [])])
                            setDeleteUsersOutOfRoomDialogOpen(true)
                        }}>
                            Удалить участников
                        </Button>
                        <Button variant="outline" onClick={() => {setAddTeamsToRoomsDialogOpen(true)}}>
                            Добавить в команды
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteTeamsOutOfRoomDialogOpen(true)}}>
                            Удалить из команды
                        </Button>
                        {/*<Button variant="outline" onClick={() => {setHideRoomDialogOpen(true)}}>*/}
                        {/*    Скрыть комнату*/}
                        {/*</Button>*/}
                        <Button variant="outline" onClick={() => {setDeleteRoomDialogOpen(true)}}>
                            Удалить комнату
                        </Button>
                        <Button variant="outline" onClick={() => {setEditRoomDialogOpen(true)}}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                        </Button>
                        <EditRoomDialog />
                    </div>
                </div>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Пользователи</Label>
                <RoomUserTableView data={members} roomId={room._id} roomName={room.name}/>
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
