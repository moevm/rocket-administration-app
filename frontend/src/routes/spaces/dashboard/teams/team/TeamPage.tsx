import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb.tsx";
import { useAtomValue, useSetAtom } from "jotai";
import {
    $prefetchedDeleteTeamFromRoomSmallRooms,
    $prefetchedDeleteUsersOutOfTeamSmallUsers,
    $selectedSpaceId, 
    $selectedTeam, 
    $selectedTeamId, 
    $selectedTeamsData,
    $teamInfo,
    $users
} from "@/store/global-store.ts";
import { NavLink, useParams } from "react-router";
import { Label } from "@/components/ui/label.tsx";
import { loaded, $api, createMutationOptions } from "@/api";
import { Button } from "@/components/ui/button.tsx";
import { useEffect, useState } from "react";
import { BatchLoader } from "@/components/app/DataLoader.tsx";
import dayjs from "dayjs";
import RoomUserTableView from "@/components/app/table/RoomUserTableView.tsx";
import RoomsTableView from "@/routes/spaces/dashboard/rooms/components/RoomsTableView.tsx";
import { showAddUsersToTeamDialogAtom } from "@/components/app/dialogs/team-page-dialogs/AddUsersToTeamDialog.tsx";
import {
    showDeleteUsersOutOfTeamDialogAtom
} from "@/components/app/dialogs/team-page-dialogs/DeleteUsersOutOfTeamDialog.tsx";
import { showAddRoomsIntoTeamDialogAtom } from "@/components/app/dialogs/team-page-dialogs/AddTeamIntoRoomDialog.tsx";
import {
    showDeleteRoomFromTeamDialogAtom
} from "@/components/app/dialogs/team-page-dialogs/DeleteTeamFromRoomDialog.tsx";
import { showDeleteTeamDialogAtom } from "@/components/app/dialogs/team-page-dialogs/DeleteTeamDialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useInvalidateTeam, useInvalidateTeams } from "@/api/invalidate";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge.tsx";

const typesType: Record<string, string> = {
    "0": "Открытый канал",
    "1": "Закрытый канал"
}

function TeamPageContent() {
    const team = loaded(useAtomValue($selectedTeam)).data;
    const allUsers = loaded(useAtomValue($users)).data;
    const creator = allUsers.find((u) => u._id === team.createdBy?._id);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!;
    const { users, rooms } = loaded(useAtomValue($teamInfo)).data;

    const [isEditing, setIsEditing] = useState(false);
    const [editedTeam, setEditedTeam] = useState({
        name: team.name || '',
        type: team.type?.toString() || '0',
    });

    const invalidateTeam = useInvalidateTeam(team?._id || '');
    const invalidateTeams = useInvalidateTeams();

    const setAddUsersToTeamDialogOpen = useSetAtom(showAddUsersToTeamDialogAtom);
    const setDeleteUsersOutOfTeamDialogOpen = useSetAtom(showDeleteUsersOutOfTeamDialogAtom);
    const setAddTeamIntoRoomDialogOpen = useSetAtom(showAddRoomsIntoTeamDialogAtom);
    const setDeleteTeamFromRoomDialogOpen = useSetAtom(showDeleteRoomFromTeamDialogAtom);
    const setDeleteTeamDialogOpen = useSetAtom(showDeleteTeamDialogAtom);
    const setSelectedTeamsData = useSetAtom($selectedTeamsData);
    const setPrefetchedDeleteUsersOutOfTeam = useSetAtom($prefetchedDeleteUsersOutOfTeamSmallUsers);
    const setPrefetchedDeleteTeamFromRoom = useSetAtom($prefetchedDeleteTeamFromRoomSmallRooms);

    const { mutate: updateTeam, isPending: isUpdating } = $api.useMutation(
        'patch',
        '/spaces/{space_id}/teams/{team_id}',
        createMutationOptions({
            onSuccess: async () => {
                await invalidateTeam();
                await invalidateTeams();
                toast.success('Команда успешно обновлена');
                setIsEditing(false);
            },
            onError: (error: any) => {
                console.error('Update error:', error);
                toast.error('Ошибка при обновлении команды', {
                    description: error?.detail || error?.message || 'Неизвестная ошибка'
                });
            }
        })
    );

    useEffect(() => {
        setSelectedTeamsData([{
            _id: team._id as string,
            roomId: team.roomId as string
        }]);
    }, [team._id, team.roomId, setSelectedTeamsData]);

    const handleSave = () => {
        const updateData: any = {};
        
        if (editedTeam.name !== team.name) updateData.name = editedTeam.name;
        if (editedTeam.type !== team.type?.toString()) updateData.type = parseInt(editedTeam.type);
        
        if (Object.keys(updateData).length > 0) {
            updateTeam({
                body: updateData,
                params: {
                    path: {
                        space_id: selectedSpaceId,
                        team_id: team._id
                    }
                }
            });
        } else {
            setIsEditing(false);
            toast.info('Нет изменений для сохранения');
        }
    };

    const handleCancel = () => {
        setEditedTeam({
            name: team.name || '',
            type: team.type?.toString() || '0',
        });
        setIsEditing(false);
    };

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

            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    {!isEditing ? (
                        <Label className="text-3xl">{team.name}</Label>
                    ) : (
                        <div className="flex-1 mr-4">
                            <Input 
                                className="text-3xl font-bold"
                                value={editedTeam.name}
                                onChange={(e) => setEditedTeam({...editedTeam, name: e.target.value})}
                            />
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                Редактировать
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    variant="default" 
                                    onClick={handleSave}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? "Сохранение..." : "Сохранить изменения"}
                                </Button>
                                <Button variant="secondary" onClick={handleCancel}>
                                    Отменить
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="border rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">ID</Label>
                                <div className="font-mono text-sm break-all">{team._id}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">ID комнаты</Label>
                                <div className="font-mono text-sm break-all">{team.roomId || '-'}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Название</Label>
                                {isEditing ? (
                                    <Input 
                                        value={editedTeam.name}
                                        onChange={(e) => setEditedTeam({...editedTeam, name: e.target.value})}
                                    />
                                ) : (
                                    <div className="font-medium">{team.name}</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Тип</Label>
                                {isEditing ? (
                                    <select 
                                        className="w-full px-3 py-2 text-sm border rounded-md"
                                        value={editedTeam.type}
                                        onChange={(e) => setEditedTeam({...editedTeam, type: e.target.value})}
                                    >
                                        <option value="0">Открытый канал</option>
                                        <option value="1">Закрытый канал</option>
                                    </select>
                                ) : (
                                    <Badge variant="outline">
                                        {typesType[team.type] || 'Неизвестно'}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Создатель</Label>
                                <div>
                                    {team.createdBy?._id ? (
                                        <NavLink 
                                            to={`/spaces/${selectedSpaceId}/dashboard/users/${team.createdBy._id}`} 
                                            className="text-blue-600 hover:underline"
                                        >
                                            {creator?.name ?? creator?.username ?? team.createdBy?.username ?? team.createdBy?._id}
                                        </NavLink>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Создано в</Label>
                                <div className="text-sm">{dayjs(team.createdAt).format('DD.MM.YYYY HH:mm')}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Обновлено в</Label>
                                <div className="text-sm">{team.updatedAt ? dayjs(team.updatedAt).format('DD.MM.YYYY HH:mm') : '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {!isEditing && (
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
                )}
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
