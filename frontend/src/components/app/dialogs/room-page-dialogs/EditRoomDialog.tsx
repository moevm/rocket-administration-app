import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedRoom, $selectedSpaceId} from "@/store/global-store.ts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {useEffect, useState} from "react";
import {$api, createMutationOptions} from "@/api";
import {loaded} from "@/api";
import {useInvalidateRoom, useInvalidateRooms} from "@/api/invalidate.ts";

export const showEditRoomDialogAtom = atom(false);

function EditRoomContent()
{
    const [open, setOpen] = useAtom(showEditRoomDialogAtom);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!;
    const room = loaded(useAtomValue($selectedRoom)).data;
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [readOnly, setReadOnly] = useState(false);
    const [topic, setTopic] = useState('');
    const [announcement, setAnnouncement] = useState('');

    const invalidateRoom = useInvalidateRoom(room._id);
    const invalidateRooms = useInvalidateRooms();

    const isChannel = room?.t === 'c';
    const endpoint = isChannel ? 'channels' : 'groups';

    useEffect(() =>
    {
        if (room && open)
        {
            setName(room.name || '');
            setDescription(room.description || '');
            setReadOnly(room.ro || false);
            setTopic(room.topic || '');
            setAnnouncement(room.announcement || '');
        }
    }, [room, open]);

    const
    {
        mutate,
        isPending
    } = $api.useMutation('patch', `/spaces/{space_id}/rooms/${endpoint}/{room_id}`, createMutationOptions({
        onSuccess: async (data) =>
        {
            await invalidateRoom();
            await invalidateRooms();
            setOpen(false);
        }
    }));

    const handleSubmit = () =>
    {
        const data: any = {};
        if (name !== room.name) data.name = name;
        if (description !== room.description) data.description = description;
        if (readOnly !== room.ro) data.readOnly = readOnly;
        if (topic !== room.topic) data.topic = topic;
        if (announcement !== room.announcement) data.announcement = announcement;

        if (Object.keys(data).length === 0)
        {
            setOpen(false);
            return;
        }

        mutate({
            body: data,
            params: {
                path: {
                    space_id: selectedSpaceId,
                    room_id: room._id
                }
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Редактировать комнату</DialogTitle>
                    <DialogDescription>
                        Измените параметры комнаты и нажмите сохранить
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Название</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Введите название комнаты"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Описание</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Введите описание"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="topic">Тема</Label>
                        <Input
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Тема комнаты"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="announcement">Объявление</Label>
                        <Input
                            id="announcement"
                            value={announcement}
                            onChange={(e) => setAnnouncement(e.target.value)}
                            placeholder="Объявление"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="readOnly"
                            checked={readOnly}
                            onCheckedChange={(checked) => setReadOnly(checked as boolean)}
                        />
                        <Label htmlFor="readOnly" className="cursor-pointer">
                            Только для чтения
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Отмена
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? "Сохранение..." : "Сохранить"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditRoomDialog()
{
    return <EditRoomContent />;
}

export default EditRoomDialog;