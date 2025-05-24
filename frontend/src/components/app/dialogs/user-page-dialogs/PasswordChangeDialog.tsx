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
import {DialogBase} from "@/components/app/dialogs/DialogBase.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {Input} from "@/components/ui/input.tsx";

export const showPasswordChangeDialogAtom = atom(false)

const PasswordChangeDialog = () => {
    const [open, setOpen] = useAtom(showPasswordChangeDialogAtom)
    const [dialogStep, setDialogStep] = useState(1);
    const [isSendingEmailChecked, setIsSendingEmailChecked] = useState(false);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const selectedUsersData = useAtomValue($selectedUsersData)
    const [changedPasswordsData, setChangedPasswordsData] = useState<object[]>([])
    const [newPassword, setNewPassword] = useState<string>("")

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setIsSendingEmailChecked(false)
            setChangedPasswordsData([])
        }
    }, [open]);

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/users/change-passwords', createMutationOptions({
        onSuccess: async (data) => {
            setChangedPasswordsData(data)
            setDialogStep(0);
        }
    }))

    const handleNextClick = () => {
        const body: any = {
            users: selectedUsersData.map(it => it._id),
            sendEmail: isSendingEmailChecked,
        };
        if (newPassword) {
            body.password = newPassword;
        }
        mutate({
            body,
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        });
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={setOpen}
            title="Сменить пароль"
            description={
                dialogStep === 1 && `Выбрано пользователей: ${selectedUsersData.length}`
            }
            footerContent={
                dialogStep === 1 && (
                    <Button type="button" variant="default" onClick={handleNextClick} disabled={isPending}>
                        Далее
                    </Button>
                )
            }
        >
            {dialogStep === 1 ? (
                    <div className={"flex flex-col justify-center gap-4"}>
                        <div className={"flex flex-col justify-center gap-4"}>
                            <Label>
                                Новый пароль.
                            </Label>
                            <Label>
                                Оставьте поле пустым, если хотите, чтобы пароли сгенерировались автоматически.
                            </Label>
                            <Input placeholder={"Введите новый пароль"} onChange={(e) => setNewPassword(e.target.value)}>
                            </Input>

                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="sendingEmail" checked={isSendingEmailChecked}
                                onCheckedChange={setIsSendingEmailChecked}/>
                            <Label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Отправить новый пароль на email?
                            </Label>
                        </div>
                    </div>

                )
                : (
                    <ExportCard data={changedPasswordsData} showData={true} countedValues={[
                        {key: 'password', display: 'Пароли сгенерированы'},
                        {key: 'password_error', display: 'Ошибок смены пароля'},
                        {key: 'email_sent', display: 'Письма отправлены'},
                        {key: 'email_send_error', display: 'Ошибок отправки письма'},
                    ]}/>
                )
            }
        </DialogBase>
    )
}

export default PasswordChangeDialog;
