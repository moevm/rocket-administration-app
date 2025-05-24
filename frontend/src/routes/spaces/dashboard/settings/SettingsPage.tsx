import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import {$smtpSettings, $selectedSpaceId, $showEditSpaceDialog} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {Loader2} from "lucide-react";
import {useSetAtom} from "jotai/react";


const formSchema = z.object({
    login: z.string().min(1, "Обязательное поле"),
    password: z.string().min(1, "Обязательное поле"),
    host: z.string().min(1, "Обязательное поле"),
    port: z.preprocess(
        (arg) => {
            if (typeof arg === 'string' && arg.trim() === '') {
                return undefined;
            }
            return arg;
        },
        z.coerce.number({
            required_error: "Обязательное поле",
            invalid_type_error: "Обязательное поле",
        })
            .int("Ожидается целое число")
            .nonnegative("Ожидается положительное число")
    ),
    path: z.string().optional(),
    sender: z.string().email()
})

function NotificationForm() {
    const notifications = loaded(useAtomValue($smtpSettings)).data
    const selectedSpaceId = useAtomValue($selectedSpaceId)!

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/settings/smtp', createMutationOptions({}))

    function onSubmit(values: z.infer<typeof formSchema>) {
        const { login, password, host, port, path, sender } = values;
        const fullUrl = `smtp://${login}:${password}@${host}:${port}${path ? `/${path}` : ''}`;


        mutate({
            body: {
                host: fullUrl,
                sender: sender
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    }

    const initialFormValues = {
        login: notifications?.value?.host ?
            new URL(notifications.value.host).username : '',
        password: notifications?.value?.host ?
            new URL(notifications.value.host).password : '',
        host: notifications?.value?.host ?
            new URL(notifications.value.host).hostname : '',
        port: notifications?.value?.host ?
            new URL(notifications.value.host).port : '',
        path: notifications?.value?.host ?
            new URL(notifications.value.host).pathname.slice(1) : '',
        sender: notifications?.value?.sender || ''
    };

    const form = useForm<z.infer<typeof formSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(formSchema),
        defaultValues: initialFormValues,
        disabled: isPending
    })

    const setShowEditSpaceDialog = useSetAtom($showEditSpaceDialog)

    return (
        <div className="flex flex-col m-6 h-screen max-w-screen-lg w-screen py-4 ml-6">
            <span className="text-4xl">Настройки</span>

            <div className="mt-6 space-y-6 w-full max-w-[550px]">

                <Card className="w-full">
                    <CardHeader>
                        SMTP
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name="login"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Логин</FormLabel>
                                            <FormControl>
                                                <Input {...field}  />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Пароль</FormLabel>
                                            <FormControl>
                                                <Input {...field}  />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="host"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Хост</FormLabel>
                                            <FormControl>
                                                <Input {...field}  />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="port"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Порт</FormLabel>
                                            <FormControl>
                                                <Input {...field}  />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="path"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Путь</FormLabel>
                                            <FormControl>
                                                <Input {...field}  />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />

                                <div className="flex flex-col space-y-2">
                                    <span>SMTP-URL</span>
                                    <div className="p-2 rounded border bg-muted/50 overflow-hidden">
                                        <code className="text-sm break-all whitespace-pre-wrap">
                                            {`smtp://${form.watch("login") || "login"}:${form.watch("password") || "password"}@${form.watch("host") || "host"}:${form.watch("port") || "port"}${form.watch("path") ? `/${form.watch("path")}` : ""}`}
                                        </code>
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="sender"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Отправитель</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending
                                        ? <>
                                            <Loader2 className="animate-spin"/>
                                            Загрузка</>
                                        : <>
                                            Сохранить
                                        </>
                                    }
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="w-full max-w-[550px]">
                    <Button
                        type="default"
                        className="w-full"
                        onClick={() => {
                            setShowEditSpaceDialog(true)
                        }}
                    >
                        Изменить пространство
                    </Button>
                </div>
            </div>
        </div>
    )
}

function SettingsPage() {
    const notifications = useAtomValue($smtpSettings)
    return (
        <>
            <BatchLoader
                states={[notifications]}
                loadingMessage={"Загрузка уведомлений"}
                display={() =>
                    <NotificationForm/>
                }
            />
        </>
    )
}

export default SettingsPage
