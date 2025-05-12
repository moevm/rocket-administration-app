import {
    Dialog, DialogClose,
    DialogContent,
    DialogDescription, DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {useAtom, useAtomValue} from "jotai/index";
import {atom} from "jotai";
import {Button} from "@/components/ui/button.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {useState} from "react";
import {$api, createMutationOptions} from "@/api";
import {$selectedSpaceId, $selectedUsersData} from "@/store/global-store.ts";

export const showPasswordChangeDialogAtom = atom(false)

const PasswordChangeDialog = () => {
    const [open, setOpen] = useAtom(showPasswordChangeDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const [isSendingEmailChecked, setIsSendingEmailChecked] = useState(false);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [changedPasswordNumber, setChangedPasswordNumber] = useState(0)
    const [emailSendNumber, setEmailSendNumber] = useState(0)

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/users/change-passwords', createMutationOptions({
        onSuccess: async (data) => {
            setChangedPasswordNumber(data.filter(item => item.password_error === null).length)
            setEmailSendNumber(data.filter(item => item.email_send_error === null).length)
            setDialogStep(0);
        }
    }))

    const handleNextClick = () => {
        mutate({
            body: {
                users: selectedUsersData.map(it => it._id),
                sendEmail: isSendingEmailChecked
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    };

    const handleDownloadClick = () => {
        console.log("Downloading")
    };

    const handleDialogOpenChange = (isOpen) => {
        if (isPending) {
            return;
        }
        if (!isOpen) {
            setDialogStep(1);
            setIsSendingEmailChecked(false)
        }
        setOpen(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Сменить пароль</DialogTitle>
                    <DialogDescription>
                        {dialogStep === 1
                            ? `Выбрано пользователей: ${selectedUsersData.length}`
                            : (
                                <>
                                    <div>Пароли успешно изменены</div>
                                    <div>Паролей изменено: {changedPasswordNumber}/{selectedUsersData.length}</div>
                                    {isSendingEmailChecked &&
                                        <div>Писем отправлено: {emailSendNumber}/{selectedUsersData.length}</div>
                                    }
                                </>
                            )
                        }
                    </DialogDescription>
                </DialogHeader>

                {dialogStep === 1 ?
                    <div className="flex items-center space-x-2">
                        <Checkbox id="sendingEmail" checked={isSendingEmailChecked}
                                  onCheckedChange={setIsSendingEmailChecked}/>
                        <label
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Отправить новый пароль на email?
                        </label>
                    </div>
                    :
                    <div className="flex flex-col space-y-2">
                        <label
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            В каком формате скачать пароли?
                        </label>

                        <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                                <Checkbox id="CSV"/>
                                <label htmlFor="CSV" className="ml-2 text-sm">CSV</label>
                            </div>
                            <div className="flex items-center">
                                <Checkbox id="XLS"/>
                                <label htmlFor="XLS" className="ml-2 text-sm">XLS</label>
                            </div>
                            <div className="flex items-center">
                                <Checkbox id="JSON"/>
                                <label htmlFor="JSON" className="ml-2 text-sm">JSON</label>
                            </div>
                        </div>
                    </div>
                }

                <DialogFooter className="sm:justify-start">
                    {dialogStep === 1 ? (
                        <Button type="button" variant="default" onClick={handleNextClick} disabled={isPending}>
                            Далее
                        </Button>
                    ) : (
                        <>
                            <DialogClose asChild>
                                <Button type="button" variant="default" onClick={handleDownloadClick}>
                                    Скачать
                                </Button>
                            </DialogClose>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default PasswordChangeDialog;
