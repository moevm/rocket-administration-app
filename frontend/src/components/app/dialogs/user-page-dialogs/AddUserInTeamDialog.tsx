import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedSpaceId, $selectedUsersData, $teams, $usersQueryOptions} from "@/store/global-store.ts";
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
import TeamSmallTableView from "@/components/app/table/TeamSmallTableView.tsx";
import {useEffect, useState} from "react";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

export const showAddUserInTeamDialogAtom = atom(false)

function AddUserInTeamContent(props: {
    smallTeams: { _id: string, name: string, roomId: string, type: number }[]
}) {

    const [open, setOpen] = useAtom(showAddUserInTeamDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [dialogStep, setDialogStep] = useState(1);
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
            setDialogStep(0)
            setResults(data)
            console.log(data)
            await queryClient.invalidateQueries({
                queryKey: $usersQueryOptions(selectedSpaceId!, true).queryKey
            })
        }
    }))

    const handleSubmit = () => {
        mutate({
            body: {
                users: selectedUsersData.map(it => it.username),
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
                            <DialogTitle>Добавить в команду</DialogTitle>
                            <DialogDescription>
                                Выбрано пользователей: {selectedUsersData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <TeamSmallTableView data={props.smallTeams} onSelectionUpdated={data => {
                                setSelectedTeamIds(data.map(it => it.getValue('roomId')));
                            }}/>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedTeamIds.length === 0}>
                                Добавить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Добавление пользователя в команду</DialogTitle>
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

function AddUserInTeamDialog() {
    const teams = useAtomValue($teams)

    return (
        <BatchLoader
            states={[teams]}
            loadingMessage='Загрузка команд'
            display={() => <AddUserInTeamContent smallTeams={
                loaded(teams).data
                    .map(({_id, name, type, roomId}) => ({_id, name, type, roomId}))
            }/>}
        />
    )
}

export default AddUserInTeamDialog
