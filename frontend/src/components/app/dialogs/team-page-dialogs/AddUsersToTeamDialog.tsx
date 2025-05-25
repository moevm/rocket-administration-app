import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedSpaceId, $selectedTeamsData, $teamsQueryOptions, $users} from "@/store/global-store.ts";
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
import {useCallback, useEffect, useState} from "react";
import UserSmallTableView from "@/components/app/table/UserSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

export const showAddUsersToTeamDialogAtom = atom(false)

function AddUsersToTeamContent(props: {
    smallUsers: { _id: string, username: string, name: string }[]
}) {
    const [open, setOpen] = useAtom(showAddUsersToTeamDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [results, setResults] = useState<object[]>([]);
    const selectedTeamsData = useAtomValue($selectedTeamsData)

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
            await queryClient.invalidateQueries({
                queryKey: $teamsQueryOptions(selectedSpaceId!, true).queryKey
            })
        }
    }))

    const handleSubmit = useCallback(() => {
        mutate({
            body: {
                users: selectedUserIds,
                rooms: selectedTeamsData.map(it => it.roomId)
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    }, [mutate, selectedUserIds, selectedTeamsData, selectedSpaceId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                {dialogStep === 1 ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Добавить участников</DialogTitle>
                            <DialogDescription>
                                Выбрано команд: {selectedTeamsData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <UserSmallTableView data={props.smallUsers} onSelectionUpdated={data =>
                                setSelectedUserIds(data.map(it => it.getValue('username')))
                            }/>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedUserIds.length === 0}>
                                Добавить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Добавить участников</DialogTitle>
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

function AddUsersToTeamDialog() {
    const users = useAtomValue($users)

    return (
        <BatchLoader
            states={[users]}
            loadingMessage='Загрузка пользователей'
            display={() => <AddUsersToTeamContent
                smallUsers={loaded(users).data.map(({_id, name, username}) => ({_id, name, username}))}/>}
        />
    )
}

export default AddUsersToTeamDialog