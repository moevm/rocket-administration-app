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
import React, {useEffect, useState} from "react";
import {
    showDeleteUserFromRoomDialogAtom
} from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromRoomDialog.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import RoomSmallTableView from "@/components/app/table/RoomSmallTableView.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import ShortTeamTableView from "@/components/app/table/ShortTeamTableView.tsx";
import TeamSmallTableView from "@/components/app/table/TeamSmallTableView.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {FormLabel} from "@/components/ui/form.tsx";

export const showDeleteUserFromTeamDialogAtom = atom(false)

interface TeamData {
    _id: string;
    roomId: string;
}

function DeleteUserFromTeamContent(props: {
    smallTeams: { _id: string, name: string, roomId: string, type: number }[]
}) {
    const [open, setOpen] = useAtom(showDeleteUserFromTeamDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [selectedTeamIds, setSelectedTeamIds] = useState<TeamData[]>([]);
    const [results, setResults] = useState<object[]>([]);
    const [linkedRooms, setLinkedRooms] = useState(false)

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);

    const {
        mutate,
        isPending
    } = $api.useMutation('delete', '/spaces/{space_id}/user_room/team', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)
            console.log(data)
        }
    }))

    const handleSubmit = () => {
        console.log(selectedTeamIds)
        mutate({
            body: {
                users: selectedUsersData.map(it => it._id),
                teams: selectedTeamIds.map(team => ({
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
                            <TeamSmallTableView data={props.smallTeams} onSelectionUpdated={data => {
                                setSelectedTeamIds(data.map(it => ({
                                    _id: it.getValue('_id'),
                                    roomId: it.getValue('roomId')
                                })));

                            }}/>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            <Checkbox
                                checked={linkedRooms}
                                onCheckedChange={setLinkedRooms}
                                className="mr-3"
                            />
                            Удалить из привязанных комнат
                        </div>


                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedTeamIds.length === 0}>
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
                        ]}/>
                    </>
                )}

            </DialogContent>
        </Dialog>
    )
}

function DeleteUserFromTeamDialog() {
    const teams = useAtomValue($teams)

    return (
        <BatchLoader
            states={[teams]}
            loadingMessage='Загрузка команд'
            display={() => <DeleteUserFromTeamContent
                smallTeams={loaded(teams).data.map(({_id, name, type, roomId}) => ({_id, name, type, roomId}))}/>}
        />
    )
}

export default DeleteUserFromTeamDialog