import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedTeamsData, $users} from "@/store/global-store.ts";
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

export const showAddUsersToTeamDialogAtom = atom(false)

function AddUsersToTeamContent() {
    const [open, setOpen] = useAtom(showAddUsersToTeamDialogAtom)
    // const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedTeamsData = useAtomValue($selectedTeamsData)
    // const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

    // const {
    //     mutate,
    //     isPending
    // } = $api.useMutation('post', '/spaces/{space_id}/user_room/', createMutationOptions({
    //     onSuccess: async (data) => {
    //         console.log(data)
    //     }
    // }))

    const handleAddClick = () => {
        // mutate({
        //     body: {
        //         users: selectedUsersData.map(it => it.username),
        //         rooms: selectedRoomIds
        //     },
        //     params: {
        //         path: {
        //             space_id: selectedSpaceId!
        //         },
        //     }
        // })
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Добавить участников</DialogTitle>
                    <DialogDescription>
                        Выбрано команд: {selectedTeamsData.length}
                    </DialogDescription>
                </DialogHeader>

                {/*<div className="max-h-[60vh] overflow-y-auto">*/}
                {/*    <RoomSmallTableView data={props.smallRooms} onSelectionUpdated={data =>*/}
                {/*        setSelectedRoomIds(data.map(it => it.getValue('_id')))*/}
                {/*    }/>*/}
                {/*</div>*/}

                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="default">
                        Добавить
                    </Button>
                </DialogFooter>
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
            display={() => <AddUsersToTeamContent/>}
        />
    )
}

export default AddUsersToTeamDialog