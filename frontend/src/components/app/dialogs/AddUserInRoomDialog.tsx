import {
    Dialog, DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {useAtom, useAtomValue} from "jotai/index";
import {atom} from "jotai";
import {Button} from "@/components/ui/button.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import {$rooms, $selectedSpaceId, $selectedUsersData} from "@/store/global-store.ts";
import {Plus} from "lucide-react";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {useState} from "react";
import RoomSmallTableView, {RoomSmallTableViewTData} from "@/components/app/table/RoomSmallTableView.tsx";
import {RowSelectionState} from "@tanstack/react-table";

export const showAddUserInRoomDialogAtom = atom(false)

function AddUserInRoomContent(props: {
    smallRooms: { _id: string, name: string | null | undefined }[]
}) {
    const [open, setOpen] = useAtom(showAddUserInRoomDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/user_room/add', createMutationOptions({
        onSuccess: async (data) => {
            console.log(data)
        }
    }))

    const handleAddClick = () => {
        mutate({
            body: {
                users: selectedUsersData.map(it => it.username),
                rooms: selectedRoomIds
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    };

    const handleDialogOpenChange = (isOpen) => {
        if (isPending) {
            return;
        }
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Добавить в комнату</DialogTitle>
                    <DialogDescription>
                        Выбрано пользователей: {selectedUsersData.length}
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto">
                    <RoomSmallTableView data={props.smallRooms} onSelectionUpdated={data =>
                        setSelectedRoomIds(data.map(it => it.getValue('_id')))
                    }/>
                </div>

                <Button variant="ghost" className="mt-2">
                    <Plus className="size-4 border"/>
                    <div>Создать новую комнату</div>
                </Button>

                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="default" onClick={handleAddClick} disabled={isPending}>
                        Добавить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const AddUserInRoomDialog = () => {
    const rooms = useAtomValue($rooms)

    const smallRooms = loaded(rooms).data.map(({_id, name}) => ({_id, name}))

    return (
        <BatchLoader
            states={[rooms]}
            loadingMessage='Загрузка комнат'
            display={() => <AddUserInRoomContent smallRooms={smallRooms}/>}
        />
    )
}

export default AddUserInRoomDialog;
