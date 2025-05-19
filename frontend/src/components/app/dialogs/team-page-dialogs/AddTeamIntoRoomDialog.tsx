import {atom, useAtom, useAtomValue} from "jotai/index";
import {$rooms, $selectedTeamsData} from "@/store/global-store.ts";
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

export const showAddTeamIntoRoomDialogAtom = atom(false)

function AddTeamIntoRoomContent() {
    const [open, setOpen] = useAtom(showAddTeamIntoRoomDialogAtom)
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
                    <DialogTitle>Добавить в комнату</DialogTitle>
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

function AddTeamIntoRoomDialog() {
    const rooms = useAtomValue($rooms)

    return (
        <BatchLoader
            states={[rooms]}
            loadingMessage='Загрузка комнат'
            display={() => <AddTeamIntoRoomContent/>}
        />
    )
}

export default AddTeamIntoRoomDialog