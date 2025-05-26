import {atom, useAtom, useAtomValue} from "jotai/index";
import {$roomsQueryOptions, $selectedRoomsData, $selectedSpaceId, $teams} from "@/store/global-store.ts";
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
import TeamSmallTableView from "@/components/app/table/TeamSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {useInvalidateEntities} from "@/api/invalidate.ts";

export const showAddRoomsToTeamsDialogAtom = atom(false)

function AddTeamsToRoomsContent(props: {
    teams: any,
    smallTeams: { _id: string, name: string, roomId: string, type: number }[]
}) {
    const [open, setOpen] = useAtom(showAddRoomsToTeamsDialogAtom)
    const selectedRoomsData = useAtomValue($selectedRoomsData)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [results, setResults] = useState<object[]>([]);

    const allTeams = props.teams.data;

    const [selectedTeamsIds, setSelectedTeamsIds] = useState<string[]>([]);

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);

    useEffect(() => {
        if (!selectedTeamIds.length) return;

        const selectedFullTeams = allTeams.filter(team =>
            selectedTeamIds.includes(team.roomId)
        );

        const teamIds = selectedFullTeams.map(team => team._id);
        setSelectedTeamsIds(teamIds);
    }, [selectedTeamIds]);

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
                            <DialogTitle>Добавить комнаты в команды</DialogTitle>
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
                                Добавить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Добавление комнаты в команды</DialogTitle>
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

function AddTeamsToRoomsDialog() {
    const teams = useAtomValue($teams)

    return (
        <BatchLoader
            states={[teams]}
            loadingMessage='Загрузка команд'
            display={() => <AddTeamsToRoomsContent teams={teams} smallTeams={loaded(teams).data.map(({_id, name, type, roomId}) => ({_id, name, type, roomId}))}/>}
        />
    )
}

export default AddTeamsToRoomsDialog
