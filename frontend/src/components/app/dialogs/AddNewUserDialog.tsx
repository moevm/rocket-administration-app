import {useAtom} from "jotai/index";
import {
    showAddNewUserDialogAtom
} from "@/store/global-store.ts";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";

function AddNewUserContent() {
    const [open, setOpen] = useAtom(showAddNewUserDialogAtom)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Создать пользователя</DialogTitle>
                </DialogHeader>

                <div>
                    Создать пользователя...
                </div>
            </DialogContent>
        </Dialog>
    )
}

function AddNewUserDialog() {
    return (
        <AddNewUserContent/>
    )
}

export default AddNewUserDialog;