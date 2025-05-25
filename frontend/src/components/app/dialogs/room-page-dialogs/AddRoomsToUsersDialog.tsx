import {atom, useAtom, useAtomValue} from "jotai/index";
import {$roomsQueryOptions, $selectedRoomsData, $selectedSpaceId, $users} from "@/store/global-store.ts";
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

export const showAddRoomsToUsersDialogAtom = atom(false)

function AddRoomsToUsersContent(props: {
    smallUsers: { _id: string, username: string, name: string }[]
}) {
    const [open, setOpen] = useAtom(showAddRoomsToUsersDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedRoomsData = useAtomValue($selectedRoomsData)
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
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
            setResults(data)
            setDialogStep(0)
            await queryClient.invalidateQueries({
                queryKey: $roomsQueryOptions(selectedSpaceId!, true).queryKey
            })
        }
    }))

    const handleSubmit = useCallback(() => {
        mutate({
            body: {
                users: selectedUserIds,
                rooms: selectedRoomsData.map(it => it._id)
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    }, [mutate, selectedUserIds, selectedRoomsData, selectedSpaceId]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                {dialogStep === 1 ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Добавить участников</DialogTitle>
                            <DialogDescription>
                                Выбрано комнат: {selectedRoomsData.length}
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

function AddRoomsToUsersDialog() {
    const users = useAtomValue($users)

    return (
        <BatchLoader
            states={[users]}
            loadingMessage='Загрузка пользователей'
            display={() => <AddRoomsToUsersContent
                smallUsers={loaded(users).data.map(({_id, name, username}) => ({_id, name, username}))}/>}
        />
    )
}

export default AddRoomsToUsersDialog