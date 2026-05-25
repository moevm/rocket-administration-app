import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb.tsx";
import { useAtomValue, useSetAtom } from "jotai";
import {
    $prefetchedDeleteUsersOutOfRoomSmallUsers,
    $selectedRoom,
    $selectedSpaceId,
    $selectedRoomId, 
    $roomInfo, 
    $selectedRoomsData,
} from "@/store/global-store.ts";
import { NavLink, useParams } from "react-router";
import { Label } from "@/components/ui/label.tsx";
import { loaded, $api, createMutationOptions } from "@/api";
import { Button } from "@/components/ui/button.tsx";
import { useEffect, useState } from "react";
import { BatchLoader } from "@/components/app/DataLoader.tsx";
import RoomUserTableView from "@/components/app/table/RoomUserTableView.tsx";
import ShortTeamTableView from "@/components/app/table/ShortTeamTableView.tsx";
import { showAddRoomsToUsersDialogAtom } from "@/components/app/dialogs/room-page-dialogs/AddRoomsToUsersDialog.tsx";
import {
    showDeleteUsersOutOfRoomDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteUsersOutOfRoomsDialog.tsx";
import { showAddRoomsToTeamsDialogAtom } from "@/components/app/dialogs/room-page-dialogs/AddTeamsToRoomsDialog.tsx";
import {
    showDeleteTeamsOutOfRoomsDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteTeamsOutOfRoomsDialog.tsx";
import { showHideRoomDialogAtom } from "@/components/app/dialogs/room-page-dialogs/HideRoomDialog.tsx";
import { showDeleteRoomDialogAtom } from "@/components/app/dialogs/room-page-dialogs/DeleteRoomDialog.tsx";
import { RoomReactWhenReadOnlySetting } from "@/components/app/RoomReactWhenReadOnlySetting.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { useInvalidateRoom, useInvalidateRooms } from "@/api/invalidate";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge.tsx";

const typesName: Record<string, string> = {
    d: "Личные сообщения",
    c: "Публичный канал",
    p: "Приватный канал",
    l: "Лайвчат",
    v: "Omnichannel VoIP rooms"
}

function RoomPageContent() {
    const room = loaded(useAtomValue($selectedRoom)).data;
    const selectedSpaceId = useAtomValue($selectedSpaceId)!;
    const { team, members, reactWhenReadOnly } = loaded(useAtomValue($roomInfo)).data;

    const [isEditing, setIsEditing] = useState(false);
    const [editedRoom, setEditedRoom] = useState({
        name: room.name || '',
        description: room.description || '',
        topic: room.topic || '',
        announcement: room.announcement || '',
        ro: room.ro || false,
        default: room.default || false,
    });

    const teams = team ? [team] : [];
    const invalidateRoom = useInvalidateRoom(room?._id || '');
    const invalidateRooms = useInvalidateRooms();

    const setAddRoomToUsersDialogOpen = useSetAtom(showAddRoomsToUsersDialogAtom);
    const setDeleteUsersOutOfRoomDialogOpen = useSetAtom(showDeleteUsersOutOfRoomDialogAtom);
    const setAddTeamsToRoomsDialogOpen = useSetAtom(showAddRoomsToTeamsDialogAtom);
    const setDeleteTeamsOutOfRoomDialogOpen = useSetAtom(showDeleteTeamsOutOfRoomsDialogAtom);
    const setHideRoomDialogOpen = useSetAtom(showHideRoomDialogAtom);
    const setDeleteRoomDialogOpen = useSetAtom(showDeleteRoomDialogAtom);
    const setSelectedRoomsData = useSetAtom($selectedRoomsData);
    const setPrefetchedDeleteUsersSmall = useSetAtom($prefetchedDeleteUsersOutOfRoomSmallUsers);

    const { mutate: updateRoom, isPending: isUpdating } = $api.useMutation(
        'patch', 
        '/spaces/{space_id}/rooms/groups/{room_id}', 
        createMutationOptions({
            onSuccess: async () => {
                await invalidateRoom();
                await invalidateRooms();
                toast.success('Комната успешно обновлена');
                setIsEditing(false);
            },
            onError: (error: any) => {
                console.error('Update error:', error);
                toast.error('Ошибка при обновлении комнаты', {
                    description: error?.detail || error?.message || 'Неизвестная ошибка'
                });
            }
        })
    );

    useEffect(() => {
        setSelectedRoomsData([{
            _id: room._id as string,
            name: room.name as string
        }]);
    }, [room._id, room.name, setSelectedRoomsData]);

    const handleSave = () => {
        const updateData: any = {};
        
        if (editedRoom.name !== room.name) updateData.name = editedRoom.name;
        if (editedRoom.description !== (room.description || '')) updateData.description = editedRoom.description;
        if (editedRoom.topic !== (room.topic || '')) updateData.topic = editedRoom.topic;
        if (editedRoom.announcement !== (room.announcement || '')) updateData.announcement = editedRoom.announcement;
        if (editedRoom.ro !== room.ro) updateData.readOnly = editedRoom.ro;
        if (editedRoom.default !== room.default) updateData.default = editedRoom.default;
        
        if (Object.keys(updateData).length > 0) {
            updateRoom({
                body: updateData,
                params: {
                    path: {
                        space_id: selectedSpaceId,
                        room_id: room._id
                    }
                }
            });
        } else {
            setIsEditing(false);
            toast.info('Нет изменений для сохранения');
        }
    };

    const handleCancel = () => {
        setEditedRoom({
            name: room.name || '',
            description: room.description || '',
            topic: room.topic || '',
            announcement: room.announcement || '',
            ro: room.ro || false,
            default: room.default || false,
        });
        setIsEditing(false);
    };

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

            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    {!isEditing ? (
                        <Label className="text-3xl">{room.name}</Label>
                    ) : (
                        <div className="flex-1 mr-4">
                            <Input 
                                className="text-3xl font-bold"
                                value={editedRoom.name}
                                onChange={(e) => setEditedRoom({...editedRoom, name: e.target.value})}
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
                                <div className="font-mono text-sm break-all">{room._id}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Тип</Label>
                                <Badge variant="outline">
                                    {typesName[room.t] || room.t || '-'}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Создатель</Label>
                                <div className="font-mono text-sm">{room.u?._id || '-'}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Сообщения</Label>
                                <div className="font-medium">{room.msgs || 0}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Пользователи</Label>
                                <div className="font-medium">{room.usersCount || 0}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Имя</Label>
                                {isEditing ? (
                                    <Input 
                                        value={editedRoom.name}
                                        onChange={(e) => setEditedRoom({...editedRoom, name: e.target.value})}
                                    />
                                ) : (
                                    <div className="font-medium">{room.name}</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Описание</Label>
                                {isEditing ? (
                                    <Input 
                                        value={editedRoom.description}
                                        onChange={(e) => setEditedRoom({...editedRoom, description: e.target.value})}
                                        placeholder="Описание комнаты"
                                    />
                                ) : (
                                    <div className="text-sm">{room.description || '-'}</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Тема</Label>
                                {isEditing ? (
                                    <Input 
                                        value={editedRoom.topic}
                                        onChange={(e) => setEditedRoom({...editedRoom, topic: e.target.value})}
                                        placeholder="Тема комнаты"
                                    />
                                ) : (
                                    <div className="text-sm">{room.topic || '-'}</div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Объявление</Label>
                                {isEditing ? (
                                    <Input 
                                        value={editedRoom.announcement}
                                        onChange={(e) => setEditedRoom({...editedRoom, announcement: e.target.value})}
                                        placeholder="Объявление"
                                    />
                                ) : (
                                    <div className="text-sm">{room.announcement || '-'}</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Broadcast</Label>
                                <div>{room.broadcast ? "Да" : "Нет"}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Реакции при Read Only</Label>
                                <RoomReactWhenReadOnlySetting
                                    spaceId={selectedSpaceId}
                                    roomId={room._id}
                                    value={reactWhenReadOnly}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Read Only</Label>
                                {isEditing ? (
                                    <Checkbox
                                        checked={editedRoom.ro}
                                        onCheckedChange={(checked) => setEditedRoom({...editedRoom, ro: checked === true})}
                                    />
                                ) : (
                                    <div>{room.ro ? "Да" : "Нет"}</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">Default</Label>
                                {isEditing ? (
                                    <Checkbox
                                        checked={editedRoom.default}
                                        onCheckedChange={(checked) => setEditedRoom({...editedRoom, default: checked === true})}
                                    />
                                ) : (
                                    <div>{room.default ? "Да" : "Нет"}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setAddRoomToUsersDialogOpen(true)}>
                        Добавить участников
                    </Button>
                    <Button variant="outline" onClick={() => {
                        setPrefetchedDeleteUsersSmall([...(members ?? [])]);
                        setDeleteUsersOutOfRoomDialogOpen(true);
                    }}>
                        Удалить участников
                    </Button>
                    <Button variant="outline" onClick={() => setAddTeamsToRoomsDialogOpen(true)}>
                        Добавить в команды
                    </Button>
                    <Button variant="outline" onClick={() => setDeleteTeamsOutOfRoomDialogOpen(true)}>
                        Удалить из команды
                    </Button>
                    <Button variant="outline" onClick={() => setHideRoomDialogOpen(true)}>
                        Скрыть комнату
                    </Button>
                    <Button variant="outline" onClick={() => setDeleteRoomDialogOpen(true)}>
                        Удалить комнату
                    </Button>
                </div>
            </div>

            <div className="pt-8">
                <Label className="text-3xl">Пользователи</Label>
                <RoomUserTableView data={members} roomId={room._id} roomName={room.name} />
            </div>

            <div className="pt-8">
                <Label className="text-3xl">Команды</Label>
                <ShortTeamTableView data={teams} />
            </div>
        </div>
    );
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
            display={() => <RoomPageContent />}
        />
    );
}

export default RoomPage;
