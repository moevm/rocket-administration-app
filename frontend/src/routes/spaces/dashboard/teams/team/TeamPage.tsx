import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb.tsx";
import {useAtomValue} from "jotai";
import {
    $prefetchedDeleteTeamFromRoomSmallRooms,
    $prefetchedDeleteUsersOutOfTeamSmallUsers,
    $selectedSpaceId, $selectedTeam, $selectedTeamId, $selectedTeamsData,
    $teamInfo,
    $users
} from "@/store/global-store.ts";
import {NavLink, useParams} from "react-router";
import {Label} from "@/components/ui/label.tsx";
import {loaded} from "@/api";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";
import {useEffect} from "react";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import EntityCard from "@/components/app/EntityCard.tsx";
import {MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import dayjs from "dayjs";
import RoomUserTableView from "@/components/app/table/RoomUserTableView.tsx";
import RoomsTableView from "@/routes/spaces/dashboard/rooms/components/RoomsTableView.tsx";
import {showAddUserInTeamDialogAtom} from "@/components/app/dialogs/user-page-dialogs/AddUserInTeamDialog.tsx";
import {showAddUsersToTeamDialogAtom} from "@/components/app/dialogs/team-page-dialogs/AddUsersToTeamDialog.tsx";
import {
    showDeleteUsersOutOfTeamDialogAtom
} from "@/components/app/dialogs/team-page-dialogs/DeleteUsersOutOfTeamDialog.tsx";
import {showAddRoomsIntoTeamDialogAtom} from "@/components/app/dialogs/team-page-dialogs/AddTeamIntoRoomDialog.tsx";
import {
    showDeleteRoomFromTeamDialogAtom
} from "@/components/app/dialogs/team-page-dialogs/DeleteTeamFromRoomDialog.tsx";
import {showDeleteTeamDialogAtom} from "@/components/app/dialogs/team-page-dialogs/DeleteTeamDialog.tsx";


const typesType = {
    "1": "Закрытый канал",
    "0": "Открытый канал"
}

function TeamPageContent() {
    const team = loaded(useAtomValue($selectedTeam)).data
    const allUsers = loaded(useAtomValue($users)).data;

    const creator = allUsers.find((u) => u._id === team.createdBy?._id);

    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const {users, rooms} = loaded(useAtomValue($teamInfo)).data

    const setAddUsersToTeamDialogOpen = useSetAtom(showAddUsersToTeamDialogAtom)
    const setDeleteUsersOutOfTeamDialogOpen = useSetAtom(showDeleteUsersOutOfTeamDialogAtom)
    const setAddTeamIntoRoomDialogOpen = useSetAtom(showAddRoomsIntoTeamDialogAtom)
    const setDeleteTeamFromRoomDialogOpen = useSetAtom(showDeleteRoomFromTeamDialogAtom)
    const setDeleteTeamDialogOpen = useSetAtom(showDeleteTeamDialogAtom)

    const setSelectedTeamsData = useSetAtom($selectedTeamsData)
    const setPrefetchedDeleteUsersOutOfTeam = useSetAtom($prefetchedDeleteUsersOutOfTeamSmallUsers)
    const setPrefetchedDeleteTeamFromRoom = useSetAtom($prefetchedDeleteTeamFromRoomSmallRooms)
    const data = [
        {
            _id: team._id as string,
            roomId: team.roomId as string
        }
    ]
    setSelectedTeamsData(data)

    return (
        <div className="flex flex-col py-6 mx-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <NavLink to={`/spaces/${selectedSpaceId}/dashboard/teams`}>
                                Команды &gt;
                            </NavLink>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col gap-2">
                <Label className={"text-3xl"}>{team.name}</Label>

                <EntityCard
                    items={[
                        ['id', <MonoRenderer value={team._id} />],
                        ['Имя', team.name],
                        ['Тип', typesType[team.type]],
                        ['Создано в', String(dayjs(team.createdAt))],
                        ['Создатель', team.createdBy?._id ? ( <NavLink to={`/spaces/${selectedSpaceId}/dashboard/users/${team.createdBy._id}`} className="text-blue-600 hover:underline" > {creator?.name ?? creator?.username ?? team.createdBy?.username ?? team.createdBy?._id} </NavLink> ) : ( <span>-</span> )],
                        ['Обновлено в', <OptRenderer value={team.updatedAt} />],
                        ['Id комнаты', <MonoRenderer value={team.roomId} />],
                    ]}
                />
                <div className={"flex justify-between gap-6"}>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => {setAddUsersToTeamDialogOpen(true)}}>
                            Добавить участников
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setPrefetchedDeleteUsersOutOfTeam([...users])
                            setDeleteUsersOutOfTeamDialogOpen(true)
                        }}>
                            Удалить участников
                        </Button>
                        <Button variant="outline" onClick={() => {setAddTeamIntoRoomDialogOpen(true)}}>
                            Привязать комнаты
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setPrefetchedDeleteTeamFromRoom(
                                rooms.map((r) => ({
                                    _id: r._id,
                                    name: r.name,
                                    t: r.t ?? 'c',
                                }))
                            )
                            setDeleteTeamFromRoomDialogOpen(true)
                        }}>
                            Отвязать комнаты
                        </Button>
                        <Button variant="outline" onClick={() => {setDeleteTeamDialogOpen(true)}}>
                            Удалить команду
                        </Button>
                    </div>
                </div>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Комнаты</Label>
                <RoomsTableView data={rooms}/>
            </div>

            <div className={"pt-8"}>
                <Label className={"text-3xl"}>Пользователи</Label>
                <RoomUserTableView data={users}/>
            </div>
        </div>
    )
}

function TeamPage() {
    const teamId = useParams()['teamId']
    const setSelectedTeamId = useSetAtom($selectedTeamId)
    const selectedTeam = useAtomValue($selectedTeam)
    const selectedTeamInfo = useAtomValue($teamInfo)
    const users = useAtomValue($users);

    useEffect(() => {
        setSelectedTeamId(teamId!)
    }, [setSelectedTeamId, teamId]);

    return (
        <BatchLoader
            states={[selectedTeam, selectedTeamInfo, users]}
            loadingMessage='Загрузка команды'
            display={() => <TeamPageContent/>}
        />
    )
}

export default TeamPage;
