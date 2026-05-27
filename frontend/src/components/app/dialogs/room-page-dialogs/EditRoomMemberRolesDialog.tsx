import {atom, useAtom, useAtomValue} from "jotai";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Label} from "@/components/ui/label.tsx";
import {useEffect, useState} from "react";
import {$selectedSpaceId} from "@/store/global-store.ts";
import {toast} from "sonner";
import {$api, errorMessage} from "@/api";
import {useInvalidateEntities} from "@/api/invalidate.ts";

const FALLBACK_ROLES = [
    {id: "moderator", label: "Модератор"},
    {id: "leader", label: "Лидер"},
    {id: "owner", label: "Владелец"},
];

export const editRoomMemberRolesDialogDataAtom = atom<{
    open: boolean;
    roomId: string | null;
    roomName?: string;
    user: {_id: string; username: string; roles?: string[]} | null;
}>({open: false, roomId: null, user: null});

export function EditRoomMemberRolesDialog() {
    const [dialogData, setDialogData] = useAtom(editRoomMemberRolesDialogDataAtom);
    const open = dialogData.open;
    const roomId = dialogData.roomId ?? "";
    const roomName = dialogData.roomName;
    const user = dialogData.user;
    const selectedSpaceId = useAtomValue($selectedSpaceId);
    const [manualUserId, setManualUserId] = useState("");
    const [manualUsername, setManualUsername] = useState("");
    const [roles, setRoles] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const invalidate = useInvalidateEntities();

    const {data: roleTypes = FALLBACK_ROLES} = $api.useQuery(
        "get",
        "/spaces/{space_id}/rooms/role-types/",
        {params: {path: {space_id: selectedSpaceId ?? ""}}},
        {enabled: open && !!selectedSpaceId}
    );

    const effectiveUser = user ?? (manualUserId && manualUsername
        ? {_id: manualUserId, username: manualUsername, roles: []}
        : null);

    const addMutation = $api.useMutation(
        "post",
        "/spaces/{space_id}/rooms/{room_id}/members/{user_id}/roles",
        {
            onSuccess: () => invalidate(),
            onError: (e) => {
                setError(errorMessage(e));
                toast.error("Ошибка добавления роли");
            },
        }
    );
    const removeMutation = $api.useMutation(
        "delete",
        "/spaces/{space_id}/rooms/{room_id}/members/{user_id}/roles",
        {
            onSuccess: () => invalidate(),
            onError: (e) => {
                setError(errorMessage(e));
                toast.error("Ошибка удаления роли");
            },
        }
    );

    useEffect(() => {
        if (open) {
            setError(null);
            if (user) {
                const current = (user.roles ?? []).map((r) => r.toLowerCase());
                setRoles(
                    Object.fromEntries(
                        roleTypes.map((r) => [r.id, current.includes(r.id)])
                    )
                );
                setManualUserId("");
                setManualUsername("");
            } else {
                setRoles(Object.fromEntries(roleTypes.map((r) => [r.id, false])));
            }
        }
    }, [open, user, roleTypes]);

    const handleSave = async () => {
        if (!roomId || !effectiveUser || !selectedSpaceId) return;
        const prevRoles = (effectiveUser.roles ?? []).map((r) => r.toLowerCase());
        const toAdd = roleTypes.filter((r) => roles[r.id] && !prevRoles.includes(r.id)).map((r) => r.id);
        const toRemove = roleTypes.filter((r) => !roles[r.id] && prevRoles.includes(r.id)).map((r) => r.id);
        setError(null);
        try {
            for (const role of toAdd) {
                const res = await addMutation.mutateAsync({
                    params: {path: {space_id: selectedSpaceId, room_id: roomId, user_id: effectiveUser._id}},
                    body: {roles: [role]},
                });
                if (!res.success && res.error) {
                    setError(res.error);
                    toast.error("Ошибка добавления роли");
                    return;
                }
            }
            for (const role of toRemove) {
                const res = await removeMutation.mutateAsync({
                    params: {path: {space_id: selectedSpaceId, room_id: roomId, user_id: effectiveUser._id}},
                    body: {roles: [role]},
                });
                if (!res.success && res.error) {
                    setError(res.error);
                    toast.error("Ошибка удаления роли");
                    return;
                }
            }
            toast.success("Роли обновлены");
            setDialogData({open: false, roomId: null, user: null});
        } catch (e) {
            setError(errorMessage(e));
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setDialogData({open: false, roomId: null, user: null});
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Изменить роли участника</DialogTitle>
                    <DialogDescription>
                        {roomName ? `Комната: ${roomName}` : roomId ? `Комната: ${roomId}` : "Выберите комнату"}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    {!user && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="manual-user-id">ID участника (заглушка)</Label>
                            <Input
                                id="manual-user-id"
                                value={manualUserId}
                                onChange={(e) => setManualUserId(e.target.value)}
                                placeholder="Введите ID пользователя"
                            />
                            <Label htmlFor="manual-username">Имя участника</Label>
                            <Input
                                id="manual-username"
                                value={manualUsername}
                                onChange={(e) => setManualUsername(e.target.value)}
                                placeholder="Введите имя"
                            />
                        </div>
                    )}
                    {user && (
                        <p className="text-sm text-muted-foreground">Участник: {user.username}</p>
                    )}
                    {effectiveUser && (
                        <div className="flex flex-col gap-3">
                            <Label>Роли</Label>
                            {roleTypes.map((r) => (
                                <div key={r.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={r.id}
                                        checked={!!roles[r.id]}
                                        onCheckedChange={(v) =>
                                            setRoles((prev) => ({...prev, [r.id]: !!v}))
                                        }
                                    />
                                    <Label htmlFor={r.id} className="font-normal">{r.label}</Label>
                                </div>
                            ))}
                            {error && <p className="text-destructive text-sm">{error}</p>}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={addMutation.isPending || removeMutation.isPending}>
                        Отмена
                    </Button>
                    <Button onClick={handleSave} disabled={!effectiveUser || !roomId || addMutation.isPending || removeMutation.isPending}>
                        Сохранить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
