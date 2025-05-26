import {atom, useAtom, useAtomValue} from "jotai/index";
import {
    $rooms,
    $selectedRoomsData,
    $selectedSpaceId,
    $selectedTeamsData,
    $teams,
    $teamsQueryOptions
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
import {useEffect, useState} from "react";
import {$api, createMutationOptions, loaded, queryClient} from "@/api";
import {
    showDeleteTeamsOutOfRoomsDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteTeamsOutOfRoomsDialog.tsx";
import TeamSmallTableView from "@/components/app/table/TeamSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import {useInvalidateEntities} from "@/api/invalidate.ts";

export const showAddRoomsIntoTeamDialogAtom = atom(false)

function AddTeamIntoRoomContent(props: {
    teams: any,
    smallRooms: { _id: string, name: string | null | undefined, t: string }[]
}) {
    const selectedTeamsData = useAtomValue($selectedTeamsData)
    const [open, setOpen] = useAtom(showAddRoomsIntoTeamDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [selectedRoomsIds, setSelectedRoomsIds] = useState<string[]>([]);
    const [results, setResults] = useState<object[]>([]);

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);

    const invalidate = useInvalidateEntities()

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/team_room/', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)
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
                            <DialogTitle>Привязка команды к комнате</DialogTitle>
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
                                Добавить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Привязка команды к комнате</DialogTitle>
                        </DialogHeader>
                        <ExportCard data={results} showData={true} countedValues={[
                            {key: 'success', display: 'Успешно привязано'},
                            {key: 'error', display: 'Ошибок'},
                        ]} />
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

function AddTeamIntoRoomDialog() {
    const rooms = useAtomValue($rooms)
    const teams = useAtomValue($teams)

    return (
        <BatchLoader
            states={[rooms, teams]}
            loadingMessage='Загрузка комнат'
            display={() => <AddTeamIntoRoomContent teams={teams} smallRooms={loaded(rooms).data.map(({_id, name, t}) => ({_id, name, t}))}/>}
        />
    )
}

export default AddTeamIntoRoomDialog
