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
import {useCallback, useEffect, useState} from "react";
import {$api, createMutationOptions} from "@/api";
import {$selectedSpaceId, $selectedUsersData} from "@/store/global-store.ts";
import {exportData, Format, writeData} from "@/lib/importExport.ts";
import {any} from "zod";
import {Label} from "@/components/ui/label.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {MultiSelect} from "@/components/ui/multi-select.tsx";
import * as React from "react";

export const showPasswordChangeDialogAtom = atom(false)

const PasswordChangeDialog = () => {
    const [open, setOpen] = useAtom(showPasswordChangeDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const [isSendingEmailChecked, setIsSendingEmailChecked] = useState(false);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [changedPasswordNumber, setChangedPasswordNumber] = useState(0)
    const [emailSendNumber, setEmailSendNumber] = useState(0)
    const [changedPasswordsData, setChangedPasswordsData] = useState<object[]>([])

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setIsSendingEmailChecked(false)
            setChangedPasswordNumber(0)
            setEmailSendNumber(0)
            setChangedPasswordsData([])
        }
    }, [open]);

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/users/change-passwords', createMutationOptions({
        onSuccess: async (data) => {
            setChangedPasswordNumber(data.filter(item => item.password_error === null).length)
            setEmailSendNumber(data.filter(item => item.email_send_error === null).length)

            console.log('changed passwords data', data)
            setChangedPasswordsData(data)
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

    //Копипаст Экспорта
    const [format, setFormat] = useState<Format>("CSV");
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    const handleExport = useCallback(() => {
        // onExport(format, selectedFields);
        const exportFile = writeData(format, changedPasswordsData, null);
        exportData(format, exportFile);

        setSelectedFields([]);
    }, [changedPasswordsData, format, selectedFields])


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

                    <div className="flex flex-col w-full gap-4">
                        <div className="flex flex-col items-start gap-2 w-full">
                            <Label>Формат</Label>
                            <RadioGroup
                                value={format}
                                onValueChange={setFormat}
                                className="grid grid-cols-3 gap-2"
                            >
                                {["CSV", "JSON", "XLSX"].map((value) => (
                                    <div key={value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={value} id={value}/>
                                        <Label htmlFor={value}>{value}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
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
                                <Button
                                    type="submit"
                                    className="w-full"
                                    onClick={handleExport}
                                >
                                    Экспорт
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
