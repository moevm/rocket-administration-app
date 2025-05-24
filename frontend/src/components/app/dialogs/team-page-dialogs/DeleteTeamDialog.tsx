import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedSpaceId, $selectedTeamsData, $teams, ApiShortTeamModel} from "@/store/global-store.ts";
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
import {$api, createMutationOptions} from "@/api";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useNavigate} from "react-router";
import {BatchLoader} from "@/components/app/DataLoader.tsx";

export const showDeleteTeamDialogAtom = atom(false)

function DeleteTeamContent(props: { teams: any }) {
    const [open, setOpen] = useAtom(showDeleteTeamDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedTeamsData = useAtomValue($selectedTeamsData)
    const [dialogStep, setDialogStep] = useState(1);
    const [results, setResults] = useState<object[]>([]);
    const [deleteLinkedRooms, setDeleteLinkedRooms] = useState<boolean>(false);
    const allTeams = props.teams.data;

    const navigate = useNavigate();

    const selectedIds = selectedTeamsData.map(i => i._id);
    const correctTeamsIds = allTeams.filter(team => selectedIds.includes(team._id));
    console.log(selectedSpaceId)
    console.log(correctTeamsIds)
    useEffect(() => {
        if (!open && dialogStep === 0) {
            navigate(`/spaces/${selectedSpaceId}/dashboard/teams`);
            window.location.reload();
        }
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);

    const {
        mutate,
        isPending
    } = $api.useMutation('delete', '/spaces/{space_id}/teams/', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)
            console.log(data)
        }
    }))

    const handleSubmit = () => {
        mutate({
            body: {
                teams: correctTeamsIds.map(team => team._id),
                delete_linked_rooms: deleteLinkedRooms
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
                            <DialogTitle>Удаление команд</DialogTitle>
                            <DialogDescription>
                                Выбрано команд: {selectedTeamsData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex justify-center items-center gap-2">
                            <Checkbox checked={deleteLinkedRooms} onCheckedChange={(x) => setDeleteLinkedRooms(!!x)}>
                            </Checkbox>
                            <Label>Удалить связанные комнаты?</Label>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending}>
                                Удалить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удаление команд</DialogTitle>
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

function DeleteTeamDialog() {
    const teams = useAtomValue($teams)

    return (
        <BatchLoader states={[teams]} loadingMessage={"Загрузка команд"} display={() => <DeleteTeamContent teams={teams}/>}/>

    )
}

export default DeleteTeamDialog