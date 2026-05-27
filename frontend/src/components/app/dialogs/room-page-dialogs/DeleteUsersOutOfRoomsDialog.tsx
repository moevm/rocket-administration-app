import {atom, useAtom, useAtomValue, useSetAtom} from "jotai/index";
import {
    ApiRoomUserModel,
    ApiUserModel,
    $prefetchedDeleteUsersOutOfRoomSmallUsers,
    $selectedRoomsData,
    $selectedSpaceId,
    $users
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
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import UserSmallTableView from "@/components/app/table/UserSmallTableView.tsx";
import {useInvalidateEntities} from "@/api/invalidate.ts";

export const showDeleteUsersOutOfRoomDialogAtom = atom(false)

function spaceUserToSmallRow(u: ApiUserModel): ApiRoomUserModel {
    return {
        _id: u._id,
        name: u.name,
        username: u.username,
        status: u.status,
        roles: u.roles,
    }
}

function DeleteUsersOutOfRoomContent(props: {
    smallUsers: ApiRoomUserModel[]
}) {
    const [open, setOpen] = useAtom(showDeleteUsersOutOfRoomDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedRoomsData = useAtomValue($selectedRoomsData)
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [results, setResults] = useState<Record<string, unknown>[]>([]);

    const setPrefetchedSmallUsers = useSetAtom($prefetchedDeleteUsersOutOfRoomSmallUsers)

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
            setPrefetchedSmallUsers(null)
        }
    }, [open, setPrefetchedSmallUsers]);

    const invalidate = useInvalidateEntities()

    const {
        mutate,
        isPending
    } = $api.useMutation('delete', '/spaces/{space_id}/user_room/group', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data as Record<string, unknown>[])
            invalidate()
        }
    }))

    const handleSubmit = () => {
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
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                {dialogStep === 1 ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удалить участников</DialogTitle>
                            <DialogDescription>
                                Выбрано комнат: {selectedRoomsData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <UserSmallTableView data={props.smallUsers} onSelectionUpdated={data =>
                                setSelectedUserIds(data.map(it => it.getValue('_id')))
                            }/>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedUserIds.length === 0}>
                                Удалить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удалить участников</DialogTitle>
                        </DialogHeader>
                        <ExportCard data={results} showData={true} countedValues={[
                            {key: 'success', display: 'Успешно удалено'},
                            {key: 'error', display: 'Ошибок'},
                        ]}/>
                    </>
                )}

            </DialogContent>
        </Dialog>
    )
}

function DeleteUsersOutOfRoomDialog() {
    const users = useAtomValue($users)
    const prefetched = useAtomValue($prefetchedDeleteUsersOutOfRoomSmallUsers)
    const states = prefetched === null ? [users] : []

    return (
        <BatchLoader
            states={states}
            loadingMessage='Загрузка пользователей'
            display={() => <DeleteUsersOutOfRoomContent
                smallUsers={prefetched === null
                    ? loaded(users).data.map(spaceUserToSmallRow)
                    : prefetched}/>}
        />
    )
}

export default DeleteUsersOutOfRoomDialog
