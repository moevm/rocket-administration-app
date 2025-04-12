import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {$api, createMutationOptions, loaded} from "@/api";
import {$notifications, $selectedSpaceId} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import UserTableView from "@/routes/spaces/dashboard/users/Components/UserTableView.tsx";
import {BatchLoader} from "@/components/reusableComponents/DataLoader.tsx";
import {useState} from "react";


const formSchema = z.object({
    host: z.string().url(),
    port: z.coerce.number({message: "Неверное число"}),
    sender: z.string().email()
})

function NotificationForm() {
    const notifications = loaded(useAtomValue($notifications)).data
    const selectedSpaceId = useAtomValue($selectedSpaceId)

    const form = useForm<z.infer<typeof formSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(formSchema),
        defaultValues: {
            host: notifications?.settings?.host,
            port: notifications?.settings?.port,
            sender: notifications?.settings?.sender
        }
    })

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/notifications/settings', createMutationOptions({
        onSuccess()  {
            console.log("success")
        },
        onError() {
            console.log('error')
        }
    }))


    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        mutate({
            body: {
                host: values.host,
                port: values.port,
                sender: values.sender
            },
            params: {
                path: {
                    space_id: selectedSpaceId
                },
            }
        })
    }


    return (
        <div className="flex flex-col m-6 h-screen max-w-screen-lg w-screen py-4 ml-6">
            <span className="text-4xl">Уведомления</span>

            <div className="mt-6">

                <Card className="max-w-[100vw] w-[450px] ">
                    <CardHeader>
                        SMTP
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
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
                                <Button type="submit" className="w-full">
                                    Сохранить
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function NotificationsPage() {
    const notifications = useAtomValue($notifications)
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

export default NotificationsPage
