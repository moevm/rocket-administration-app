import {atom, useAtom, useAtomValue} from "jotai/index";
import {$rooms, $selectedSpaceId, $selectedTeamsData, $teams, $teamsQueryOptions} from "@/store/global-store.ts";
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
import {$api, createMutationOptions, loaded, queryClient} from "@/api";
import {useEffect, useState} from "react";
import {showAddRoomsIntoTeamDialogAtom} from "@/components/app/dialogs/team-page-dialogs/AddTeamIntoRoomDialog.tsx";
import TeamSmallTableView from "@/components/app/table/TeamSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import {useInvalidateEntities} from "@/api/invalidate.ts";

export const showDeleteRoomFromTeamDialogAtom = atom(false)


function DeleteTeamFromRoomContent(props: {
    teams: any,
    smallRooms: { _id: string, name: string | null | undefined, t: string }[]
}) {
    const selectedTeamsData = useAtomValue($selectedTeamsData)
    const [open, setOpen] = useAtom(showDeleteRoomFromTeamDialogAtom)
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
    } = $api.useMutation('delete', '/spaces/{space_id}/team_room/', createMutationOptions({
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
    const teams = useAtomValue($teams)

    return (
        <BatchLoader
            states={[rooms, teams]}
            loadingMessage='Загрузка комнат'
            display={() => <DeleteTeamFromRoomContent teams={teams} smallRooms={loaded(rooms).data.map(({_id, name, t}) => ({_id, name, t}))}/>}
        />
    )
}

export default DeleteTeamFromRoomDialog
