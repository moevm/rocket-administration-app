import {useAtom} from "jotai/index";
import {
    showAddNewRoomDialogAtom
} from "@/store/global-store.ts";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";

function AddNewRoomContent() {
    const [open, setOpen] = useAtom(showAddNewRoomDialogAtom)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Создать комнату</DialogTitle>
                </DialogHeader>

                <div>
                    Создать комнату...
                </div>
            </DialogContent>
        </Dialog>
    )
}

function AddNewRoomDialog() {
    return (
        <AddNewRoomContent/>
    )
}

export default AddNewRoomDialog;