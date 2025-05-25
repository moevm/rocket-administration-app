import {useAtom, useAtomValue} from "jotai/index";
import {useEffect, useState} from "react";
import {
    $selectedSpaceId,
    showAddNewRoomDialogAtom
} from "@/store/global-store.ts";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog.tsx";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {z} from "zod";
import {useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {$api, createMutationOptions} from "@/api";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

const channelGroupSchema = z.object({
    name: z.string().min(3, {message: "Минимум 3 символа"}),
    readOnly: z.boolean(),
    excludeSelf: z.boolean(),
});

const groupSchema = z.object({
    login: z.string().min(3, {message: "Минимум 3 символа"}),
    email: z.string().email("Неверный email"),
    password: z.string().min(5, {message: "Минимум 5 символов"}),
});

function AddNewRoomContent() {
    const [open, setOpen] = useAtom(showAddNewRoomDialogAtom)
    const selectedSpaceId = useAtomValue($selectedSpaceId)

    const {
        mutate: mutateChannels,
        isPending: isPendingChannels
    } = $api.useMutation('post', '/spaces/{space_id}/rooms/channels/', createMutationOptions())

    const {
        mutate: mutateGroups,
        isPending: isPendingGroups
    } = $api.useMutation('post', '/spaces/{space_id}/rooms/groups/', createMutationOptions())


    const {
        mutate: mutateTeams,
        isPending: isPendingTeams
    } = $api.useMutation('post', '/spaces/{space_id}/teams/', createMutationOptions())

    const channelGroupForm = useForm<z.infer<typeof channelGroupSchema>>({
        resolver: zodResolver(channelGroupSchema),
        defaultValues: {
            name: "",
            readOnly: false,
            excludeSelf: false
        },
        disabled: isPendingChannels || isPendingGroups
    });

    const teamSchema = z.object({
        name: z.string(),
        teamType: z.string(),
    })

    const teamForm = useForm<z.infer<typeof teamSchema>>({
        reValidateMode: "onChange",
        mode: "all",
        resolver: zodResolver(teamSchema),
        defaultValues: {
            name: "",
            teamType: "0"
        },
        disabled: isPendingTeams
    })

    const [activeTab, setActiveTab] = useState("channel");

    useEffect(() => {
        channelGroupForm.reset();
        teamForm.reset();
    }, [activeTab]);

    function handleChannelCreate (values: z.infer<typeof channelGroupSchema>) {
        mutateChannels({
            body: {
                rooms: [
                    {
                        name: values.name,
                        readOnly: values.readOnly,
                        excludeSelf: false
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

    function handleGroupCreate (values: z.infer<typeof channelGroupSchema>) {
        mutateGroups({
            body: {
                rooms: [
                    {
                        name: values.name,
                        readOnly: values.readOnly,
                        excludeSelf: false
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

    function handleTeamCreate (values: z.infer<typeof teamSchema>) {
        mutateTeams({
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
            <DialogContent className="max-w-xl w-full">
                <DialogHeader>
                    <DialogTitle>Создать комнату</DialogTitle>
                </DialogHeader>

                <div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList>
                            <TabsTrigger value="channel">Канал</TabsTrigger>
                            <TabsTrigger value="group">Группа</TabsTrigger>
                            <TabsTrigger value="team">Команда</TabsTrigger>
                        </TabsList>

                        <TabsContent value="channel">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Создать канал</CardTitle>
                                    <CardDescription>
                                    </CardDescription>
                                </CardHeader>
                                <Form {...channelGroupForm}>
                                    <form onSubmit={channelGroupForm.handleSubmit(handleChannelCreate)}>

                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={channelGroupForm.control}
                                                name="name"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Название</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Введите название" {...field} />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={channelGroupForm.control}
                                                name="readOnly"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <div className={"flex justify-items-center items-center gap-2"}>
                                                            <FormControl>
                                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel>Только для чтения</FormLabel>
                                                        </div>

                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            {/*<FormField*/}
                                            {/*    control={channelGroupForm.control}*/}
                                            {/*    name="excludeSelf"*/}
                                            {/*    render={({field}) => (*/}
                                            {/*        <FormItem className={"flex justify-start items-center gap-2"}>*/}
                                            {/*            <FormControl>*/}
                                            {/*                <Checkbox checked={field.value} onCheckedChange={field.onChange} />*/}
                                            {/*            </FormControl>*/}
                                            {/*            <FormLabel>Не включать себя в новую комнату</FormLabel>*/}
                                            {/*            <FormMessage/>*/}
                                            {/*        </FormItem>*/}
                                            {/*    )}*/}
                                            {/*/>*/}

                                        </CardContent>
                                        <CardFooter>
                                            <Button type={"submit"}>Создать</Button>
                                        </CardFooter>
                                    </form>
                                </Form>


                            </Card>
                        </TabsContent>

                        <TabsContent value="group">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Создать группу</CardTitle>
                                    <CardDescription>
                                    </CardDescription>
                                </CardHeader>
                                <Form {...channelGroupForm}>
                                    <form onSubmit={channelGroupForm.handleSubmit(handleGroupCreate)}>

                                        <CardContent className="space-y-4">
                                            <FormField
                                                control={channelGroupForm.control}
                                                name="name"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <FormLabel>Название</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Введите название" {...field} />
                                                        </FormControl>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={channelGroupForm.control}
                                                name="readOnly"
                                                render={({field}) => (
                                                    <FormItem>
                                                        <div className={"flex justify-items-center items-center gap-2"}>
                                                            <FormControl>
                                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <FormLabel>Только для чтения</FormLabel>
                                                        </div>

                                                        <FormMessage/>
                                                    </FormItem>
                                                )}
                                            />

                                            {/*<FormField*/}
                                            {/*    control={channelGroupForm.control}*/}
                                            {/*    name="excludeSelf"*/}
                                            {/*    render={({field}) => (*/}
                                            {/*        <FormItem className={"flex justify-start items-center gap-2"}>*/}
                                            {/*            <FormControl>*/}
                                            {/*                <Checkbox checked={field.value} onCheckedChange={field.onChange} />*/}
                                            {/*            </FormControl>*/}
                                            {/*            <FormLabel>Не включать себя в новую комнату</FormLabel>*/}
                                            {/*            <FormMessage/>*/}
                                            {/*        </FormItem>*/}
                                            {/*    )}*/}
                                            {/*/>*/}

                                        </CardContent>
                                        <CardFooter>
                                            <Button type={"submit"}>Создать</Button>
                                        </CardFooter>
                                    </form>
                                </Form>


                            </Card>
                        </TabsContent>

                        <TabsContent value="team">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Создать команду</CardTitle>
                                    <CardDescription>
                                    </CardDescription>
                                </CardHeader>
                                <Form {...teamForm}>
                                    <form onSubmit={teamForm.handleSubmit(handleTeamCreate)}>

                                        <CardContent className="space-y-2">
                                            <FormField
                                                control={teamForm.control}
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
                                                control={teamForm.control}
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
                                        </CardContent>
                                        <CardFooter>
                                            <Button type={"submit"}>Создать</Button>
                                        </CardFooter>
                                    </form>
                                </Form>


                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AddNewRoomDialog() {
    return (
        <AddNewRoomContent/>
    )
}

export default AddNewRoomDialog;
