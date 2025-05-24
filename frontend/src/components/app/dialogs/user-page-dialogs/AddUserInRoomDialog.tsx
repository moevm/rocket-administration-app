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
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {useCallback, useEffect, useState} from "react";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

export const showAddUserInRoomDialogAtom = atom(false)

function AddUserInRoomContent(props: {
    smallRooms: { _id: string, name: string | null | undefined, t: string}[]
}) {
    const [open, setOpen] = useAtom(showAddUserInRoomDialogAtom)
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
    } = $api.useMutation('post', '/spaces/{space_id}/user_room/', createMutationOptions({
        onSuccess: async (data) => {
            setResults(data)
            setDialogStep(0)
        }
    }))

    const handleAddClick = useCallback(() => {
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
    }, [mutate, selectedUsersData, selectedRoomIds, selectedSpaceId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl min-w-0">
                {dialogStep === 1 ? (
                    <>
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
                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleAddClick}
                                    disabled={isPending || selectedRoomIds.length === 0}>
                                Добавить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Добавить в комнату</DialogTitle>
                        </DialogHeader>
                        <ExportCard data={results} showData={true} countedValues={[
                            {key: 'success', display: 'Успешно добавлено'},
                            {key: 'error', display: 'Ошибок'},
                        ]} />
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

const AddUserInRoomDialog = () => {
    const rooms = useAtomValue($rooms)

    return (
        <BatchLoader
            states={[rooms]}
            loadingMessage='Загрузка комнат'
            display={() => <AddUserInRoomContent smallRooms={
                loaded(rooms).data
                    .map(({ _id, name, t }) => ({ _id, name, t }))
            }/>}
        />
    )
}

export default AddUserInRoomDialog;
