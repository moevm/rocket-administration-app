import {atom, useAtom, useAtomValue, useSetAtom} from "jotai/index";
import {
    ApiRoomUserModel,
    ApiUserModel,
    $prefetchedDeleteUsersOutOfTeamSmallUsers,
    $selectedSpaceId,
    $selectedTeamsData,
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
import {useCallback, useEffect, useState} from "react";
import {$api, createMutationOptions, loaded} from "@/api";
import UserSmallTableView from "@/components/app/table/UserSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {useInvalidateEntities} from "@/api/invalidate.ts";

export const showDeleteUsersOutOfTeamDialogAtom = atom(false)

function spaceUserToSmallRow(u: ApiUserModel): ApiRoomUserModel {
    return {
        _id: u._id,
        name: u.name,
        username: u.username,
        status: u.status,
        roles: u.roles,
    }
}

function DeleteUsersOutOfTeamContent(props: {
    smallUsers: ApiRoomUserModel[]
}) {
    const [open, setOpen] = useAtom(showDeleteUsersOutOfTeamDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [results, setResults] = useState<Record<string, unknown>[]>([]);
    const selectedTeamsData = useAtomValue($selectedTeamsData)
    const [linkedRooms, setLinkedRooms] = useState(false)

    const setPrefetchedSmallUsers = useSetAtom($prefetchedDeleteUsersOutOfTeamSmallUsers)

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
    } = $api.useMutation('delete', '/spaces/{space_id}/user_room/team', createMutationOptions({
        onSuccess: async (data) => {
            setResults(data as Record<string, unknown>[])
            setDialogStep(0)
            invalidate()
        }
    }))

    const handleSubmit = useCallback(() => {
        mutate({
            body: {
                users: selectedUserIds,
                teams: selectedTeamsData.map(team => ({
                    id: team._id,
                    rid: team.roomId
                })),
                ban_in_rooms: linkedRooms

            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    }, [mutate, selectedUserIds, selectedTeamsData, selectedSpaceId, linkedRooms]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                {dialogStep === 1 ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удалить участников</DialogTitle>
                            <DialogDescription>
                                Выбрано команд: {selectedTeamsData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <UserSmallTableView data={props.smallUsers} onSelectionUpdated={data =>
                                setSelectedUserIds(data.map(it => it.getValue('_id')))
                            }/>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <Checkbox
                                checked={linkedRooms}
                                onCheckedChange={(v) => setLinkedRooms(v === true)}
                                className="mr-3"
                            />
                            Удалить из привязанных комнат
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedTeamsData.length === 0}>
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
                        ]} />
                    </>
                )}

            </DialogContent>
        </Dialog>
    )
}

function DeleteUsersOutOfTeamDialog() {
    const users = useAtomValue($users)
    const prefetched = useAtomValue($prefetchedDeleteUsersOutOfTeamSmallUsers)
    const states = prefetched === null ? [users] : []

    return (
        <BatchLoader
            states={states}
            loadingMessage='Загрузка пользователей'
            display={() => <DeleteUsersOutOfTeamContent
                smallUsers={prefetched === null
                    ? loaded(users).data.map(spaceUserToSmallRow)
                    : prefetched}/>}
        />
    )
}

export default DeleteUsersOutOfTeamDialog
