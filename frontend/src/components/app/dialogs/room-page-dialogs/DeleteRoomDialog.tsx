import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedRoomsData, $selectedSpaceId} from "@/store/global-store.ts";
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
import {useNavigate} from "react-router";
import {$api, createMutationOptions} from "@/api";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Label} from "@/components/ui/label.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

export const showDeleteRoomDialogAtom = atom(false)

function DeleteRoomContent() {
    const [open, setOpen] = useAtom(showDeleteRoomDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedRoomsData = useAtomValue($selectedRoomsData)
    const [dialogStep, setDialogStep] = useState(1);
    const [results, setResults] = useState<object[]>([]);

    const navigate = useNavigate();

    useEffect(() => {
        if (!open && dialogStep === 0) {
            navigate(`/spaces/${selectedSpaceId}/dashboard/rooms`);
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
    } = $api.useMutation('delete', '/spaces/{space_id}/rooms/', createMutationOptions({
        onSuccess: async (data) => {
            setDialogStep(0)
            setResults(data)
        }
    }))

    const handleSubmit = () => {
        mutate({
            body: {
                rooms: selectedRoomsData.map(team => team._id),
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
                                <DialogTitle>Удаление комнат</DialogTitle>
                                <DialogDescription className={"flex flex-col gap-2"}>
                                    <Label> Выбрано комнат: {selectedRoomsData.length}.</Label>
                                    <Label> Вы уверены, что хотите удалить комнаты?</Label>
                                </DialogDescription>
                            </DialogHeader>

                            <DialogFooter className="sm:justify-start">
                                <Button type="button" variant="default" onClick={handleSubmit}
                                        disabled={isPending}>
                                    Удалить
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Удаление команд</DialogTitle>
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

function DeleteRoomDialog() {
    return (
        <DeleteRoomContent/>
    )
}

export default DeleteRoomDialog
