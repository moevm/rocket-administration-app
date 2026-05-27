import {atom, useAtom, useAtomValue} from "jotai/index";
import {
    $selectedRoomsData,
    $selectedSpaceId,
    $teams
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
import {$api, createMutationOptions, loaded} from "@/api";
import TeamSmallTableView from "@/components/app/table/TeamSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {useInvalidateEntities} from "@/api/invalidate.ts";

export const showDeleteTeamsOutOfRoomsDialogAtom = atom(false)

function DeleteTeamsOutOfRoomsContent(props: {
    teamsForRoom: { _id: string; name: string; roomId: string; type: number }[]
    smallTeams: { _id: string, name: string, roomId: string, type: number }[]
}) {
    const [open, setOpen] = useAtom(showDeleteTeamsOutOfRoomsDialogAtom)
    const selectedRoomsData = useAtomValue($selectedRoomsData)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [results, setResults] = useState<Record<string, unknown>[]>([]);

    const allTeams = props.teamsForRoom;

    const [selectedTeamsIds, setSelectedTeamsIds] = useState<string[]>([]);

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);

    useEffect(() => {
        if (!selectedTeamIds.length) {
            setSelectedTeamsIds([])
            return
        }

        const selectedFullTeams = allTeams.filter(team =>
            selectedTeamIds.includes(team.roomId)
        );

        const teamIds = selectedFullTeams.map(team => team._id);
        setSelectedTeamsIds(teamIds);
    }, [selectedTeamIds, allTeams]);

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
                teams: selectedTeamsIds,
                rooms: selectedRoomsData.map(it => it._id)
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
                            <DialogTitle>Удаление комнаты из команды</DialogTitle>
                            <DialogDescription>
                                Выбрано команд: {selectedTeamIds.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <TeamSmallTableView data={props.smallTeams} onSelectionUpdated={data =>
                            {
                                setSelectedTeamIds(data.map(it => it.getValue('roomId')));
                            }
                            }/>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedTeamsIds.length === 0}>
                                Удалить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удаление комнаты из команды</DialogTitle>
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

function DeleteTeamsOutOfRoomsDialog() {
    const teams = useAtomValue($teams)
    const selectedRoomsData = useAtomValue($selectedRoomsData)

    return (
        <BatchLoader
            states={[teams]}
            loadingMessage='Загрузка команд'
            display={() => {
                const roomIds = new Set(selectedRoomsData.map((r) => r._id))
                const teamsForRoom = loaded(teams).data
                    .filter((t): t is typeof t & { roomId: string } => t.roomId != null && roomIds.has(t.roomId))
                    .map((t) => ({
                        _id: t._id,
                        name: t.name ?? '',
                        roomId: t.roomId,
                        type: t.type ?? 0,
                    }))
                return (
                    <DeleteTeamsOutOfRoomsContent teamsForRoom={teamsForRoom} smallTeams={teamsForRoom}/>
                )
            }}
        />
    )
}

export default DeleteTeamsOutOfRoomsDialog
