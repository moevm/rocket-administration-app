import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedRoomsData, $selectedSpaceId, $selectedTeamsData, $teams, $users} from "@/store/global-store.ts";
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
import {
    showDeleteUsersOutOfRoomDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteUsersOutOfRoomsDialog.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import UserSmallTableView from "@/components/app/table/UserSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

export const showDeleteUsersOutOfTeamDialogAtom = atom(false)

function DeleteUsersOutOfTeamContent(props: {
    teams: any,
    smallUsers: { _id: string, username: string, name: string, status: string }[]
}) {
    const [open, setOpen] = useAtom(showDeleteUsersOutOfTeamDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedTeamsData = useAtomValue($selectedTeamsData);

    const allTeams = props.teams.data;
    console.log(allTeams);

    const selectedTeamIds = selectedTeamsData.map(team => team._id);

    const selectedFullTeams = allTeams.filter(team =>
        selectedTeamIds.includes(team._id)
    )

    const selectedRoomIds = selectedFullTeams
        .map(team => team.roomId)
        .filter(Boolean);

    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [results, setResults] = useState<object[]>([]);


    console.log(selectedTeamsData)

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/user_room/remove', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)
            console.log(data)
        }
    }))

    const handleSubmit = () => {
        mutate({
            body: {
                users: selectedUserIds,
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
                            <DialogTitle>Удалить участников</DialogTitle>
                            <DialogDescription>
                                Выбрано команд: {selectedFullTeams.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <UserSmallTableView data={props.smallUsers} onSelectionUpdated={data =>
                                setSelectedUserIds(data.map(it => it.getValue('_id')))
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
                            <DialogTitle>Удаление пользователя из команды</DialogTitle>
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

function DeleteUsersOutOfTeamDialog() {
    const users = useAtomValue($users)
    const teams = useAtomValue($teams)

    return (
        <BatchLoader
            states={[users, teams]}
            loadingMessage='Загрузка пользователей'
            display={() => <DeleteUsersOutOfTeamContent teams={teams} smallUsers={loaded(users).data.map(({_id, name, username, status}) => ({_id, name, username, status}))}/>}
        />
    )
}

export default DeleteUsersOutOfTeamDialog