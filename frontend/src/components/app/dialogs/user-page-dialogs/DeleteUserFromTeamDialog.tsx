import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedSpaceId, $selectedUsersData, $teams} from "@/store/global-store.ts";
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
    showDeleteUserFromRoomDialogAtom
} from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromRoomDialog.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import ShortTeamTableView from "@/components/app/table/ShortTeamTableView.tsx";
import TeamSmallTableView from "@/components/app/table/TeamSmallTableView.tsx";

export const showDeleteUserFromTeamDialogAtom = atom(false)

function DeleteUserFromTeamContent(props: {
    smallTeams: { _id: string, name: string, roomId: string, type: number }[]
}) {
    const [open, setOpen] = useAtom(showDeleteUserFromTeamDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
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
    } = $api.useMutation('post', '/spaces/{space_id}/user_room/remove', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)
            console.log(data)
        }
    }))

    const handleSubmit = () => {
        console.log(selectedUsersData.map(it => it._id), selectedTeamIds)
        mutate({
            body: {
                users: selectedUsersData.map(it => it._id),
                rooms: selectedTeamIds
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
                            <DialogTitle>Удалить из команды</DialogTitle>
                            <DialogDescription>
                                Выбрано пользователей: {selectedUsersData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <TeamSmallTableView data={props.smallTeams} onSelectionUpdated={data =>
                            {
                                console.log(data.map(it => it.getValue('roomId')))
                                setSelectedTeamIds(data.map(it => it.getValue('roomId')));
                                }
                            }/>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}>
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

function DeleteUserFromTeamDialog() {
    const teams = useAtomValue($teams)
    console.log(teams)

    return (
        <BatchLoader
            states={[teams]}
            loadingMessage='Загрузка команд'
            display={() => <DeleteUserFromTeamContent smallTeams={loaded(teams).data.map(({_id, name, type, roomId}) => ({_id, name, type, roomId}))}/>}
        />
    )
}

export default DeleteUserFromTeamDialog