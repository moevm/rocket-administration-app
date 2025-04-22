import {
    Form,
    FormControl, FormDescription,
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
import {Loader2} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query"
import {$spacesQueryOptions,} from "@/store/global-store.ts";
import {useNavigate} from "react-router";

const formSchema = z.object({
    name: z.string().min(2),
    url: z.string().url(),
    user_id: z.string(),
    token: z.string()
})

function RegisterSpace() {

    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {mutate, isPending} = $api.useMutation('post', '/spaces/', createMutationOptions({
        onSuccess: async (data: any) => {
            await queryClient.invalidateQueries({
                queryKey: $spacesQueryOptions().queryKey
            })
            navigate(`/spaces/${data._id}`)
        }
    }))

    const form = useForm<z.infer<typeof formSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(formSchema),
        disabled: isPending
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutate({
            body: {
                url: values.url,
                user_id: values.user_id,
                token: values.token,
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
                    <Form {...form}>
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
                </CardContent>
            </Card>
        </div>
    )
}

export default RegisterSpace
