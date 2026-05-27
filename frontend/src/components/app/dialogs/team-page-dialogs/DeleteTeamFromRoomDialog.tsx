import {atom, useAtom, useAtomValue, useSetAtom} from "jotai/index";
import {
    $prefetchedDeleteTeamFromRoomSmallRooms,
    $rooms,
    $selectedSpaceId,
    $selectedTeamsData,
} from "@/store/global-store.ts";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import {useEffect, useState} from "react";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import {useInvalidateEntities} from "@/api/invalidate.ts";

export const showDeleteRoomFromTeamDialogAtom = atom(false)


function DeleteTeamFromRoomContent(props: {
    smallRooms: { _id: string, name: string | null | undefined, t: string }[]
}) {
    const selectedTeamsData = useAtomValue($selectedTeamsData)
    const [open, setOpen] = useAtom(showDeleteRoomFromTeamDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [selectedRoomsIds, setSelectedRoomsIds] = useState<string[]>([]);
    const [results, setResults] = useState<Record<string, unknown>[]>([]);

    const setPrefetchedRooms = useSetAtom($prefetchedDeleteTeamFromRoomSmallRooms)

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
            setPrefetchedRooms(null)
        }
    }, [open, setPrefetchedRooms]);

    const invalidate = useInvalidateEntities()

    const {
        mutate,
        isPending
    } = $api.useMutation('delete', '/spaces/{space_id}/team_room/', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data as Record<string, unknown>[])
            invalidate()
        }
    }))

    const handleSubmit = () => {
        mutate({
            body: {
                teams: selectedTeamsData.map(it => it._id),
                rooms: selectedRoomsIds
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
                            <DialogTitle>Отвязывание комнат от выбранных команд</DialogTitle>
                            <DialogDescription>
                                Выбрано команд: {selectedRoomsIds.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <RoomSmallTableView data={props.smallRooms} onSelectionUpdated={data =>
                                setSelectedRoomsIds(data.map(it => it.getValue('_id')))
                            }/>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedRoomsIds.length === 0}>
                                Удалить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Отвязывание комнат от выбранных команд</DialogTitle>
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

function DeleteTeamFromRoomDialog() {
    const rooms = useAtomValue($rooms)
    const prefetched = useAtomValue($prefetchedDeleteTeamFromRoomSmallRooms)
    const states = prefetched === null ? [rooms] : []

    return (
        <BatchLoader
            states={states}
            loadingMessage='Загрузка комнат'
            display={() => <DeleteTeamFromRoomContent
                smallRooms={prefetched === null
                    ? loaded(rooms).data.map(({_id, name, t}) => ({
                        _id,
                        name,
                        t: t ?? 'c',
                    }))
                    : prefetched}/>}
        />
    )
}

export default DeleteTeamFromRoomDialog
