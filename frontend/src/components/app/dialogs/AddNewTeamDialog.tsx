import {
    Dialog, DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {useAtom, useAtomValue} from "jotai/index";
import {Button} from "@/components/ui/button.tsx";
import {$api, createMutationOptions, queryClient} from "@/api";
import {
    $rooms, $roomsQuery, $roomsQueryOptions,
    $selectedSpaceId, $usersQueryOptions,
    showAddNewTeamDialogAtom
} from "@/store/global-store.ts";
import {Loader2} from "lucide-react";
import {BatchLoader} from "@/components/app/DataLoader.tsx";
import {Input} from "@/components/ui/input.tsx";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {toast} from "sonner";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

function AddNewTeamContent() {
    const [open, setOpen] = useAtom(showAddNewTeamDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)!

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/teams/', createMutationOptions({
        onSuccess: async (data) => {
            console.log(data)
            toast.success("Команда успешно создана");
            setOpen(false);
            await queryClient.invalidateQueries({
                queryKey: $roomsQueryOptions(selectedSpaceId!, true).queryKey
            })
        },
        onError: async (error) => {
            console.log(error);
            toast.error("Ошибка при создании команды");
        }
    }))

    const formSchema = z.object({
        name: z.string(),
        teamType: z.string(),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            teamType: "0"
        },
        disabled: isPending
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
        mutate({
            body: {
                teams: [
                    {
                        name: values.name,
                        team_type: Number(values.teamType),
                    },
                ],
            },
            params: {
                path: {
                    space_id: selectedSpaceId!
                },
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Создать команду</DialogTitle>
                </DialogHeader>

                <div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Название команды</FormLabel>
                                        <FormControl>
                                            <Input {...field}  />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="teamType"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Тип команды</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Выберите тип команды"/>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="0">Открытая</SelectItem>
                                                <SelectItem value="1">Закрытая</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                </div>

                {/*<DialogFooter className="sm:justify-start">*/}
                {/*    <Button type="button" variant="default" onClick={handleAddClick} disabled={isPending}>*/}
                {/*        Создать*/}
                {/*    </Button>*/}
                {/*</DialogFooter>*/}
            </DialogContent>
        </Dialog>
    )
}

const AddNewTeamDialog = () => {
    const rooms = useAtomValue($rooms)

    return (
        <BatchLoader
            states={[rooms]}
            loadingMessage='Загрузка комнат'
            display={() => <AddNewTeamContent/>}
        />
    )
}

export default AddNewTeamDialog;
