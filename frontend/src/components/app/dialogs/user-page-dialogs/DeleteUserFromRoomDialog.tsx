import {atom, useAtom, useAtomValue} from "jotai/index";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {$rooms, $selectedSpaceId, $selectedUsersData} from "@/store/global-store.ts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {showAddUserInRoomDialogAtom} from "@/components/app/dialogs/user-page-dialogs/AddUserInRoomDialog.tsx";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

export const showDeleteUserFromRoomDialogAtom = atom(false)

function DeleteUserFromRoomContent(props: {
    smallRooms: { _id: string, name: string | null | undefined, t: string }[]
}) {
    const [open, setOpen] = useAtom(showDeleteUserFromRoomDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [results, setResults] = useState<object[]>([]);


    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);

    const {
        mutate,
        isPending
    } = $api.useMutation('delete', '/spaces/{space_id}/user_room/group', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)
        }
    }))

    const handleSubmit = () => {
        mutate({
            body: {
                users: selectedUsersData.map(it => it._id),
                rooms: selectedRoomIds
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                {dialogStep === 1 ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удалить из комнаты</DialogTitle>
                            <DialogDescription>
                                Выбрано пользователей: {selectedUsersData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <RoomSmallTableView data={props.smallRooms} onSelectionUpdated={data =>
                                setSelectedRoomIds(data.map(it => it.getValue('_id')))
                            }/>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedRoomIds.length === 0}>
                                Удалить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удаление пользователя из комнаты</DialogTitle>
                        </DialogHeader>
                        <ExportCard data={results} showData={true} countedValues={[
                            {key: 'success', display: 'Успешно удалено'},
                            {key: 'error', display: 'Ошибок'},
                        ]} />
                    </>
                )}

            </DialogContent>
        </Dialog>
    )
}

function DeleteUserFromRoomDialog() {
    const rooms = useAtomValue($rooms)

    return (
        <>
            <BatchLoader
                states={[rooms]}
                loadingMessage='Загрузка комнат'
                display={() => <DeleteUserFromRoomContent smallRooms={loaded(rooms).data.map(({_id, name, t}) => ({_id, name, t}))}/>}
            />
        </>
    )
}

export default DeleteUserFromRoomDialog
