import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {$api, createMutationOptions, loaded, queryClient} from "@/api";
import {
    $smtpSettings,
    $selectedSpaceId,
    ApiSmtpSettingsModel,
    $spacesQueryOptions, $spaces, $selectedSpace, ApiSpaceModel
} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {Loader2} from "lucide-react";
import {registerSchema} from "@/lib/form.ts";


const smtpSettingsSchema = z.object({
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

function EditSpaceContent(props: {
    space: ApiSpaceModel
}) {
    const selectedSpaceId = useAtomValue($selectedSpaceId)!

    const {mutate, isPending} = $api.useMutation('patch', '/spaces/{space_id}', createMutationOptions({
        onSuccess: async (data: any) => {
            await queryClient.invalidateQueries({
                queryKey: $spacesQueryOptions().queryKey
            })
        }
    }))

    const initialFormValues = {
        name: props.space?.name || '',
        url: props.space?.url || '',
        user_id: props.space?.user_id || '',
        token: props.space?.token || ''
    };

    const form = useForm<z.infer<typeof registerSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(registerSchema),
        disabled: isPending,
        defaultValues: initialFormValues
    })

    function onSubmit(values: z.infer<typeof registerSchema>) {
        mutate({
            body: {
                url: values.url,
                user_id: values.user_id,
                token: values.token,
                name: values.name
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        });
    }


    return (
        <Card className="w-full">
            <CardHeader>
                Изменение пространства
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Название пространства</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="url"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Ссылка</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="user_id"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Ваш ID (user_id)</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="token"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>
                                            Токен
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} type="password"/>
                                        </FormControl>
                                        <FormDescription>
                                            Токен должен быть сгенерирован с опцией обхода двухфакторной авторизации.
                                        </FormDescription>
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
                </Form>
            </CardContent>
        </Card>
    )
}

function SMTPSettingsContent(props: {
    smtpSettings: ApiSmtpSettingsModel
}) {
    const selectedSpaceId = useAtomValue($selectedSpaceId)!

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/settings/smtp', createMutationOptions({}))

    function onSubmit(values: z.infer<typeof smtpSettingsSchema>) {
        const {login, password, host, port, path, sender} = values;
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
        login: props.smtpSettings?.value?.host ?
            new URL(props.smtpSettings.value?.host).username : '',
        password: props.smtpSettings?.value?.host ?
            new URL(props.smtpSettings.value?.host).password : '',
        host: props.smtpSettings?.value?.host ?
            new URL(props.smtpSettings.value?.host).hostname : '',
        port: props.smtpSettings?.value?.host ?
            new URL(props.smtpSettings.value?.host).port : '',
        path: props.smtpSettings?.value?.host ?
            new URL(props.smtpSettings.value?.host).pathname.slice(1) : '',
        sender: props.smtpSettings?.value?.sender || ''
    };

    const form = useForm<z.infer<typeof smtpSettingsSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(smtpSettingsSchema),
        defaultValues: initialFormValues,
        disabled: isPending
    })

    return (
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
    )
}

function SettingsPageContent(props: {
    smtpSetting: ApiSmtpSettingsModel,
    space: ApiSpaceModel
}) {
    return (
        <div className="flex flex-col m-6 h-screen max-w-screen-lg w-screen py-4 ml-6">
            <span className="text-4xl">Настройки</span>

            <div className="mt-6 flex space-x-6 w-full">
                <div className="w-[550px]">
                    <SMTPSettingsContent smtpSettings={props.smtpSetting}/>
                </div>
                <div className="w-[550px]">
                    <EditSpaceContent space={props.space}/>
                </div>
            </div>
        </div>
    )
}

function SettingsPage() {
    const smtpSettings = useAtomValue($smtpSettings)
    const selectedSpace = useAtomValue($selectedSpace)!

    return (
        <BatchLoader
            states={[smtpSettings, selectedSpace]}
            loadingMessage={"Загрузка пространства"}
            display={() =>
                <SettingsPageContent
                    smtpSetting={loaded(smtpSettings).data}
                    space={loaded(selectedSpace).data}
                />
            }
        />
    )
}

export default SettingsPage
