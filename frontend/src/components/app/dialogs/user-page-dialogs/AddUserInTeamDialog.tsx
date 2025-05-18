import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedUsersData, $teams} from "@/store/global-store.ts";
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
import {Plus} from "lucide-react";

export const showAddUserInTeamDialogAtom = atom(false)

function AddUserInTeamContent(props: {
    // smallTeams: { _id: string, name: string | null | undefined }[]
}) {

    const [open, setOpen] = useAtom(showAddUserInTeamDialogAtom)
    // const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
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
                    <DialogTitle>Добавить в команду</DialogTitle>
                    <DialogDescription>
                        Выбрано пользователей: {selectedUsersData.length}
                    </DialogDescription>
                </DialogHeader>

                {/*<div className="max-h-[60vh] overflow-y-auto">*/}
                {/*    <RoomSmallTableView data={props.smallRooms} onSelectionUpdated={data =>*/}
                {/*        setSelectedRoomIds(data.map(it => it.getValue('_id')))*/}
                {/*    }/>*/}
                {/*</div>*/}

                <Button variant="ghost" className="mt-2">
                    <Plus className="size-4 border"/>
                    <div>Создать новую команду НЕ РАБОТАЕТ</div>
                </Button>

                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="default">
                        Добавить
                    </Button>
                </DialogFooter>
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
            display={() => <AddUserInTeamContent/>}
        />
    )
}

export default AddUserInTeamDialog