import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form.tsx";
import {Button} from "@/components/ui/button.tsx";
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input.tsx";
import {Card, CardContent, CardHeader} from "@/components/ui/card.tsx";
import {$api, createMutationOptions} from "@/api";
import * as url from "url";
import {Toaster} from "sonner";
import {Loader2} from "lucide-react";

const formSchema = z.object({
    //TODO validation
    name: z.string().min(2),
    url: z.string().url(),
    login: z.string(),
    password: z.string()
})

function RegisterSpace() {
    const {mutate, isPending} = $api.useMutation('post', '/spaces', createMutationOptions())

    const form = useForm<z.infer<typeof formSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(formSchema),
        disabled: isPending
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        // TODO registration new space
        console.log(values)
        mutate({
            body: {
                url: values.url,
                login: values.login,
                password: values.password,
                name: values.name
            },
        });
    }


    return (
        <div className="flex justify-center items-center min-h-[100vh] bg-secondary">
            <Card className="max-w-[100vw] w-[450px]">
                <CardHeader>
                    Регистрация пространства
                </CardHeader>
                <CardContent>
                    <Form {...form} className={""}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                name="login"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Логин</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                            <Input {...field} type="password"/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending
                                    ? <>
                                        <Loader2 className="animate-spin"/>
                                        Please wait</>
                                    : <>
                                        Сохранить
                                    </>
                                }
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegisterSpace