import {FileDialog} from "@/components/app/dialogs/FileDialog.tsx";
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel} from "@/components/ui/form.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {toast} from "sonner";
import {$api, createMutationOptions} from "@/api";
import {useAtomValue} from "jotai/index";
import {$selectedSpaceId} from "@/store/global-store.ts";
import React, {useEffect, useState} from "react";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";
import {useInvalidateUsers} from "@/api/invalidate.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

interface UserImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const FormSchema = z.object({
    verified: z.boolean().default(false).optional(),
    requirePasswordChange: z.boolean().default(false).optional(),
    joinDefaultChannels: z.boolean().default(true).optional(),
    sendEmail: z.boolean().default(false).optional(),
})

const roles = [
  { value: "admin", label: "admin" },
  { value: "moderator", label: "moderator" },
  { value: "leader", label: "leader" },
  { value: "owner", label: "owner" },
  { value: "user", label: "user" },
  { value: "bot", label: "bot" },
  { value: "app", label: "app" },
  { value: "guest", label: "guest" },
  { value: "anonymous", label: "anonymous" },
  { value: "livechat-agent", label: "livechat-agent" },
  { value: "livechat-manager", label: "livechat-manager" },
  { value: "livechat-monitor", label: "livechat-monitor" },
];

export const UserImportDialog = ({
                                     open,
                                     onOpenChange
                                 }: UserImportDialogProps) => {

    const selectedSpaceId = useAtomValue($selectedSpaceId)!
    const [success, setSuccess] = React.useState<boolean>(false)
    const [successData, setSuccessData] = React.useState<any>(null)
    const [internalStep, setInternalStep] = useState(0);
    const [previewUsers, setPreviewUsers] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    
    const [passwordMode, setPasswordMode] = useState<'generate' | 'admin'>('generate');

    const invalidate = useInvalidateUsers()

    const {
        mutate,
        isPending
    } = $api.useMutation('post', '/spaces/{space_id}/users/', createMutationOptions({
        async onSuccess(data) {
            setSuccess(true)
            setSuccessData(data)
            setInternalStep(2)
            invalidate()
            setIsImporting(false)
        },
        onError: (error) => {
            toast.error("Ошибка импорта: " + (error.message || "Неизвестная ошибка"));
            setIsImporting(false);
        }
    }))

    useEffect(() => {
        if (!open) {
            setInternalStep(0);
            setSuccess(false);
            setSuccessData(null);
            setPreviewUsers([]);
            setPasswordMode('generate');
            setIsImporting(false);
        }
    }, [open]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        disabled: isPending || isImporting
    })

    const parseAndValidateObjects = (objects: any[]): any[] | null => {
        const validUsers: any[] = [];
        for (let object of objects) {
            object = Object.fromEntries(Object.entries(object).map(([k, v]) => ([k.toLowerCase(), v])));

            if (!object.hasOwnProperty('username') || String(object['username']) == 'null') {
                console.info({error: object});
                toast.error('Не найден обязательный параметр username');
                return null;
            }

            if (object.hasOwnProperty('emails')) {
                object['email'] = object['emails'];
            }

            if (!object.hasOwnProperty('email') || String(object['email']) == 'null') {
                toast.error('Не найден обязательный параметр email');
                return null;
            }

            if (typeof object['email'] !== 'string' || object['email'].startsWith('[')) {
                let emails;
                if (typeof object['email'] === 'string') {
                    emails = JSON.parse(object['email']);
                } else {
                    emails = object['email'];
                }

                if (emails.length === 0) {
                    toast.error('Не заполнен email для пользователя ' + object['username']);
                    return null;
                }
                object['email'] = emails[0].address;
            }

            if (!object.hasOwnProperty('name') || String(object['name']) == 'null') {
                toast.error('Не найден обязательный параметр name');
                return null;
            }

            validUsers.push({
                username: object.username,
                email: object.email,
                name: object.name,
                role: 'user',     
                password: '',     
            });
        }
        return validUsers;
    };

    const handleFileSubmit = (objects: any[]) => {
        const validUsers = parseAndValidateObjects(objects);
        if (!validUsers) return false; 
        setPreviewUsers(validUsers);
        setInternalStep(1);
        return false; 
    };

    const handleConfirmImport = () => {
        const settings = form.getValues();
        const usersToImport = previewUsers.map(user => ({
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            ...(user.password ? { password: user.password } : {}),
        }));

        setIsImporting(true);
        mutate({
            body: {
                users: usersToImport,
                verified: settings.verified || false,
                requirePasswordChange: settings.requirePasswordChange || false,
                joinDefaultChannels: settings.joinDefaultChannels || false,
                sendEmail: settings.sendEmail || false,
            },
            params: {
                path: {
                    space_id: selectedSpaceId
                }
            }
        });
    };

    const updateUserField = (index: number, field: string, value: any) => {
        setPreviewUsers(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const renderPreview = () => (
        <div className="space-y-4">
            <div className="border rounded-md overflow-auto max-h-[400px]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Password (optional)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {previewUsers.map((user, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>
                                    <Select
                                        value={user.role}
                                        onValueChange={(val) => updateUserField(idx, 'role', val)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map(role => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                        type="text"
                                        placeholder="Оставьте пустым для автогенерации"
                                        value={user.password}
                                        onChange={(e) => updateUserField(idx, 'password', e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setInternalStep(0)}>Назад</Button>
                <Button onClick={handleConfirmImport} disabled={isImporting}>
                    {isImporting ? "Импорт..." : "Подтвердить импорт"}
                </Button>
            </div>
        </div>
    );

    const getContent = () => {
        if (internalStep === 0) {
            return (
                <div className="space-y-4">
                    <Form {...form}>
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
                                            Автоматически подтвердить аккаунты
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
                    </Form>
                    
                    <div className="border-t pt-4">
                        <label className="text-base font-medium">Установка пароля</label>
                        <RadioGroup
                            value={passwordMode}
                            onValueChange={(val) => setPasswordMode(val as 'generate' | 'admin')}
                            className="mt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="generate" id="generate" />
                                <label htmlFor="generate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Сгенерировать пароль автоматически
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admin" id="admin" />
                                <label htmlFor="admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Установить пароль администратором
                                </label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            );
        } else if (internalStep === 1) {
            return renderPreview();
        } else {
            return (
                <ExportCard data={successData} showData={true} countedValues={[
                    {key: 'created_id', display: 'Успех'},
                    {key: 'error', display: 'Ошибка'},
                    {key: 'email_sent', display: 'Email отправлен'},
                    {key: 'email_error', display: 'Ошибка отправки email'},
                ]}/>
            );
        }
    };

    return (
        <FileDialog
            open={open}
            onOpenChange={onOpenChange}
            dialogStep={internalStep === 0 ? 1 : (internalStep === 2 ? 0 : 1)}
            title="Импорт"
            description={
                internalStep === 0
                    ? 'Обязательные поля: username, email, name'
                    : internalStep === 1
                    ? 'Проверьте и отредактируйте данные пользователей'
                    : 'Результат импорта'
            }
            loading={isPending || isImporting}
            content={getContent()}
            onSubmit={handleFileSubmit}
            submitEnabled={internalStep === 0}
        />
    )
}