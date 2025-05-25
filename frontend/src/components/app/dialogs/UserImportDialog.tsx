import {FileDialog} from "@/components/app/dialogs/FileDialog.tsx";
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {toast} from "sonner";
import {$api, createMutationOptions, queryClient} from "@/api";
import {useAtomValue} from "jotai/index";
import {$selectedSpaceId, $usersQueryOptions} from "@/store/global-store.ts";
import React, {useEffect, useState} from "react";
import {BatchResult} from "@/components/app/BatchResult.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {useInvalidateEntities, useInvalidateUsers} from "@/api/invalidate.ts";

interface UserImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const FormSchema = z.object({
    verified: z.boolean().default(false).optional(),
    requirePasswordChange: z.boolean().default(false).optional(),
    joinDefaultChannels: z.boolean().default(true).optional(),
    sendEmail: z.boolean().default(false).optional(),
})

export const UserImportDialog = ({
                                     open,
                                     onOpenChange
                                 }: UserImportDialogProps) => {

    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [success, setSuccess] = React.useState<boolean>(false)
    const [successData, setSuccessData] = React.useState<any>(null)
    const [dialogStep, setDialogStep] = useState(1);

    const invalidate = useInvalidateUsers()

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/users/', createMutationOptions({
        async onSuccess(data) {
            setSuccess(true)
            setSuccessData(data)
            setDialogStep(0)
            invalidate()
        }
    }))

    useEffect(() => {
        if (!open) {
            setDialogStep(1)
            setSuccess(false)
            setSuccessData(null)
        }
    }, [open]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        disabled: isPending
    })

    return (
        <FileDialog
            open={open}
            onOpenChange={onOpenChange}
            dialogStep={dialogStep}
            title="Импорт"
            description={
                dialogStep === 1 && 'Обязательные поля: username, email, name'
            }
            loading={isPending}
            content={
                dialogStep === 1 ? (
                    <Form {...form}>
                        <FormField
                            control={form.control}
                            name="verified"
                            render={({field}) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Автоматически подтвердить аккаунты
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="requirePasswordChange"
                            render={({field}) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Потребовать смену пароля
                                        </FormLabel>
                                        <FormDescription>
                                            Встроенная функция RocketChat
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="joinDefaultChannels"
                            render={({field}) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Присоединиться к каналам по умолчанию
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sendEmail"
                            render={({field}) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Отправить письмо с паролем
                                        </FormLabel>
                                        <FormDescription>
                                            Средствами RocketManager
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </Form>
                ) : (
                    <ExportCard data={successData} showData={true} countedValues={[
                        {key: 'created_id', display: 'Успех'},
                        {key: 'error', display: 'Ошибка'},
                        {key: 'email_sent', display: 'Email отправлен'},
                        {key: 'email_error', display: 'Ошибка отправки email'},
                    ]}/>
                )
            }

            onSubmit={(objects) => {
                let newObjects: object[] = []
                for (let object of objects) {
                    object = Object.fromEntries(Object.entries(object).map(([k, v]) => ([k.toLowerCase(), v])))

                    if (!object.hasOwnProperty('username') || String(object['username']) == 'null') {
                        console.info({error: object})
                        toast.error('Не найден обязательный параметр username')
                        return
                    }

                    if (object.hasOwnProperty('emails')) {
                        object['email'] = object['emails']
                    }

                    if (!object.hasOwnProperty('email') || String(object['email']) == 'null') {
                        toast.error('Не найден обязательный параметр email')
                        return
                    }

                    if (typeof object['email'] !== 'string' || object['email'].startsWith('[')) {
                        let emails
                        if (typeof object['email'] === 'string') {
                            emails = JSON.parse(object['email'])
                        } else {
                            emails = object['email']
                        }

                        if (emails.length === 0) {
                            toast.error('Не заполнен email для пользователя ' + object['username'])
                        }
                        object['email'] = emails[0].address
                    }

                    if (!object.hasOwnProperty('name') || String(object['name']) == 'null') {
                        toast.error('Не найден обязательный параметр name')
                        return
                    }

                    newObjects.push(object)
                }

                const settings = form.getValues()

                mutate({
                    body: {
                        users: newObjects,
                        verified: settings.verified || false,
                        requirePasswordChange: settings.requirePasswordChange || false,
                        joinDefaultChannels: settings.joinDefaultChannels || false,
                        sendEmail: settings.sendEmail || false,
                    },
                    params: {
                        path: {
                            space_id: selectedSpaceId
                        }
                    }
                })
                return false
            }}
        />
    )
}
