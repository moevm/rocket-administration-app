import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedSpaceId, $selectedUsersData} from "@/store/global-store.ts";
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
import {$api, createMutationOptions} from "@/api";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useNavigate} from "react-router";

export const showDeleteUserDialogAtom = atom(false)

function DeleteUserContent() {
    const [open, setOpen] = useAtom(showDeleteUserDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [dialogStep, setDialogStep] = useState(1);
    const [results, setResults] = useState<object[]>([]);
    const [forceDelete, setForceDelete] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!open && dialogStep === 0) {
            navigate(`/spaces/${selectedSpaceId}/dashboard/users`);
            window.location.reload();
        }
        if (!open) {
            setDialogStep(1)
            setResults([])
        }
    }, [open]);


    const {
        mutate,
        isPending
    } = $api.useMutation('delete', '/spaces/{space_id}/users/', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)}
    }))

    const handleSubmit = () => {
        mutate({
            body: {
                users: selectedUsersData.map(it => it._id),
                force_delete: forceDelete
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
                            <DialogTitle>Удаление пользователей</DialogTitle>
                            <DialogDescription>
                                Выбрано пользователей: {selectedUsersData.length}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex justify-center items-center gap-2">
                            <Checkbox checked={forceDelete} onCheckedChange={(checked) => setForceDelete(!!checked)}>
                            </Checkbox>
                            <Label> Удалить пользователей, если они последние в комнате? </Label>
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <Button type="button" variant="default" onClick={handleSubmit}
                                    disabled={isPending || selectedUsersData.length === 0}>
                                Удалить
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Удаление пользователей</DialogTitle>
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


function DeleteUserDialog() {
    return (
        <DeleteUserContent/>
    )
}

export default DeleteUserDialog
