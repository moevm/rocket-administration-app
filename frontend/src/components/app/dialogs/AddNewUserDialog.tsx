import {useAtom, useAtomValue} from "jotai/index";
import {
    $selectedSpaceId, $usersQueryOptions,
    showAddNewUserDialogAtom
} from "@/store/global-store.ts";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
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
import {Loader2} from "lucide-react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {$api, createMutationOptions, queryClient} from "@/api";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import React, {useEffect, useState} from "react";
import {Label} from "@/components/ui/label.tsx";
import {toast} from "sonner";

const formSchema = z.object({
    username: z.string().min(1, "Обязательное поле"),
    email: z.string().email().min(1, "Обязательное поле"),
    name: z.string().min(1, "Обязательное поле"),
    verified: z.boolean(),
    requirePasswordChange: z.boolean(),
    joinDefaultChannels: z.boolean(),
    sendEmail: z.boolean(),
})

function AddNewUserContent() {
    const [open, setOpen] = useAtom(showAddNewUserDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const [error, setError] = useState<string | null>(null)

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/users', createMutationOptions({}))

    const form = useForm<z.infer<typeof formSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            email: "",
            name: "",
            verified: true,
            requirePasswordChange: false,
            joinDefaultChannels: false,
            sendEmail: true,
        },
        disabled: isPending
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        mutate({
            body: {
                users: [{
                    username: values.username,
                    email: values.email,
                    name: values.name
                }],
                verified: values.verified,
                requirePasswordChange: values.requirePasswordChange,
                joinDefaultChannels: values.joinDefaultChannels,
                sendEmail: values.sendEmail
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        }, {
            onSuccess: (data) => {
                console.log(data)
                queryClient.invalidateQueries({
                    queryKey: $usersQueryOptions(selectedSpaceId!, true).queryKey
                })
                if (data[0]?.error) {
                    console.log((`Ошибка: ${data[0].error}`));
                    setError(data[0].error);
                    toast.error(data[0].error);
                } else {
                    setOpen(false);
                }
            }
        })
    }

    useEffect(() => {
        if (!open) {
            form.reset();
            setError(null);
        }
    }, [open]);


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="flex flex-col gap-2">
                <DialogHeader>
                    <DialogTitle>Создать пользователя</DialogTitle>
                </DialogHeader>

                <div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col justify-center gap-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Никнейм</FormLabel>
                                        <FormControl>
                                            <Input {...field}  />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>email</FormLabel>
                                        <FormControl>
                                            <Input type={"email"} {...field}  />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Имя</FormLabel>
                                        <FormControl>
                                            <Input {...field}  />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

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
                                                Автоматически подтвердить аккаунт
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

                            <DialogFooter className={"flex flex-col justify-center items-center gap-2"}>
                                <div>
                                    {error && (<Label className="text-red-500">
                                        {error}
                                    </Label>)}
                                </div>
                                <div>
                                    <Button type="submit" className="w-full" disabled={isPending}>
                                        {isPending
                                            ? <>
                                                <Loader2 className="animate-spin"/>
                                                Загрузка</>
                                            : <>
                                                Создать
                                            </>
                                        }
                                    </Button>
                                </div>

                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function AddNewUserDialog() {
    return (
        <AddNewUserContent/>
    )
}

export default AddNewUserDialog;