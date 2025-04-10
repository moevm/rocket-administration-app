import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";


const formSchema = z.object({
    host: z.string(),
    port: z.string(),
    sender: z.string()
})


function NotificationsPage() {

    const form = useForm<z.infer<typeof formSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(formSchema)
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
    }

    return (
        <>
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
                                                    <Input {...field} />
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
                                        Проверить
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}

export default NotificationsPage
