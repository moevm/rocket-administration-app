import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb.tsx";
import {useAtomValue} from "jotai";
import {
    $selectedSpaceId, $selectedTeam, $selectedTeamId,
    $teamInfo
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


const typesType = {
    "1": "Закрытый канал",
    "0": "Открытый канал"
}

function TeamPageContent() {
    const team = loaded(useAtomValue($selectedTeam)).data
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const {users, rooms} = loaded(useAtomValue($teamInfo)).data

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
                        ['Создатель', <MonoRenderer value={team.createdBy._id} />],
                        ['Обновлено в', <OptRenderer value={team.updatedAt} />],
                        ['Id комнаты', <MonoRenderer value={team.roomId} />],
                        ['Комнаты', <OptRenderer value={team.rooms} />],
                        ['Количество пользователей', <OptRenderer value={team.numberOfUsers} />],
                    ]}
                />
                <div className={"flex justify-between gap-6"}>
                    <div className="flex justify-between gap-2">
                        <Button variant="outline">
                            Добавить участников
                        </Button>
                        <Button variant="outline">
                            Удалить участников
                        </Button>
                        <Button variant="outline">
                            Добавить в комнату
                        </Button>
                        <Button variant="outline">
                            Удалить из комнаты
                        </Button>
                        <Button variant="outline">
                            Удалить комнату
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

    useEffect(() => {
        setSelectedTeamId(teamId!)
    }, [setSelectedTeamId, teamId]);

    return (
        <BatchLoader
            states={[selectedTeam, selectedTeamInfo]}
            loadingMessage='Загрузка команды'
            display={() => <TeamPageContent/>}
        />
    )
}

export default TeamPage;
