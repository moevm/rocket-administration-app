import {atom, useAtom, useAtomValue} from "jotai/index";
import {$selectedUser, $selectedSpaceId} from "@/store/global-store.ts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {useEffect, useState} from "react";
import {$api, createMutationOptions} from "@/api";
import {loaded} from "@/api";
import {useInvalidateUser, useInvalidateUsers} from "@/api/invalidate";

export const showEditUserDialogAtom = atom(false);

function EditUserContent()
{
    const [open, setOpen] = useAtom(showEditUserDialogAtom);
    const selectedSpaceId = useAtomValue($selectedSpaceId)!;
    const user = loaded(useAtomValue($selectedUser)).data;
    
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('');
    const [active, setActive] = useState(true);
    const [requirePasswordChange, setRequirePasswordChange] = useState(false);

    const invalidateUser = useInvalidateUser(user?._id || '');
    const invalidateUsers = useInvalidateUsers();

    useEffect(() => {
        if (user && open) {
            setName(user.name || '');
            setUsername(user.username || '');
            setEmail(user.emails?.[0]?.address || '');
            setStatus(user.status || 'offline');
            setActive(user.active !== false);
            setRequirePasswordChange(user.requirePasswordChange || false);
        }
    }, [user, open]);

    const
    {
        mutate: updateUser,
        isPending: isUpdating
    } = $api.useMutation('patch', '/spaces/{space_id}/users/{user_id}', createMutationOptions({
        onSuccess: async () =>
        {
            await invalidateUser();
            await invalidateUsers();
            setOpen(false);
        }
    }));

    const
    {
        mutate: setUserStatus,
        isPending: isSettingStatus
    } = $api.useMutation('post', '/spaces/{space_id}/users/{user_id}/status', createMutationOptions({
        onSuccess: async () =>
        {
            await invalidateUser();
        }
    }));

    const handleSubmit = () =>
    {
        if (!user)
            return;

        const userData: any = {};
        
        if (name !== user.name) userData.name = name;
        if (username !== user.username) userData.username = username;
        
        const currentEmail = user.emails?.[0]?.address;
        if (email !== currentEmail)
        {
            userData.email = email;
        }
        
        if (active !== user.active) userData.active = active;

        if (Object.keys(userData).length > 0)
        {
            updateUser({
                body: userData,
                params:
                {
                    path:
                    {
                        space_id: selectedSpaceId,
                        user_id: user._id
                    }
                }
            });
        }

        if (Object.keys(userData).length === 0 && status === user.status)
        {
            setOpen(false);
        }
    };

    const isPending = isUpdating || isSettingStatus;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Редактировать пользователя</DialogTitle>
                    <DialogDescription>
                        {user?.name} ({user?.username})
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Имя</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Полное имя"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="username">Логин</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Имя пользователя"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="active"
                            checked={active}
                            onCheckedChange={(checked) => setActive(checked as boolean)}
                        />
                        <Label htmlFor="active" className="cursor-pointer">
                            Активен
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Отмена
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? "Сохранение..." : "Сохранить"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog()
{
    return <EditUserContent />;
}

export default EditUserDialog;