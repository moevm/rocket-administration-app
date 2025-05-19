import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedRoomsData} from "@/store/global-store.ts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";

export const showHideRoomDialogAtom = atom(false)

function HideRoomContent() {
    const [open, setOpen] = useAtom(showHideRoomDialogAtom)
    // const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedRoomsData = useAtomValue($selectedRoomsData)
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
                    <DialogTitle>Скрыть комнату</DialogTitle>
                    <DialogDescription>
                        Выбрано комнат: {selectedRoomsData.length}
                    </DialogDescription>
                </DialogHeader>

                {/*<div className="max-h-[60vh] overflow-y-auto">*/}
                {/*    <RoomSmallTableView data={props.smallRooms} onSelectionUpdated={data =>*/}
                {/*        setSelectedRoomIds(data.map(it => it.getValue('_id')))*/}
                {/*    }/>*/}
                {/*</div>*/}

                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="default">
                        Скрыть
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function HideRoomDialog() {
    return (
        <HideRoomContent/>
    )
}

export default HideRoomDialog