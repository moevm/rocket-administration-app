import {useAtom, useAtomValue} from "jotai/index";
import {$selectedSpaceId, $showEditSpaceDialog, $spacesQueryOptions} from "@/store/global-store.ts";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {registerSchema} from "@/lib/form.ts";
import {zodResolver} from "@hookform/resolvers/zod";
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
import {$api, createMutationOptions, queryClient} from "@/api";

function EditSpaceContent() {
    const [open, setOpen] = useAtom($showEditSpaceDialog)
    const selectedSpaceId = useAtomValue($selectedSpaceId)!

    const {mutate, isPending} = $api.useMutation('patch', '/spaces/{space_id}', createMutationOptions({
        onSuccess: async (data: any) => {
            await queryClient.invalidateQueries({
                queryKey: $spacesQueryOptions().queryKey
            })
        }
    }))

    const form = useForm<z.infer<typeof registerSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(registerSchema),
        disabled: isPending
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Изменить пространство</DialogTitle>
                </DialogHeader>

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
                        <Button type="submit" className="w-full">
                            Сохранить
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

function EditSpaceDialog() {
    return (
        <EditSpaceContent/>
    )
}

export default EditSpaceDialog