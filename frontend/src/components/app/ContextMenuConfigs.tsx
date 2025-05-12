import React from 'react';
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {ContextMenuConfig} from "@/components/app/table/RichTableView.tsx";
import {showAddUserInRoomDialogAtom} from "@/components/app/dialogs/AddUserInRoomDialog.tsx";
import {showPasswordChangeDialogAtom} from "@/components/app/dialogs/PasswordChangeDialog.tsx";
import {useSetAtom} from "jotai/react";
import {$selectedUsersData} from "@/store/global-store.ts";
import {Row} from "@tanstack/react-table";

const RoomContextMenuItems = ({ rows }: { rows: Row<{ _id: string }>[] }) => {
    return (
        <>
            <ContextMenuItem>Удалить комнату</ContextMenuItem>
            <ContextMenuItem>Скрыть комнату</ContextMenuItem>
            <ContextMenuItem>Добавить участников</ContextMenuItem>
            <ContextMenuItem>Удалить участников</ContextMenuItem>
            <ContextMenuItem>Добавить команды</ContextMenuItem>
            <ContextMenuItem>Удалить команды</ContextMenuItem>
            {rows.length === 1 && <ContextMenuItem>Управление</ContextMenuItem>}
        </>
    )
};


export const roomContextMenuConfig: ContextMenuConfig<{
    _id: string
}> = {
    getLabel: (rows) =>
        rows.length === 1 ? (rows[0].getValue("name") ? rows[0].getValue("name") : rows[0].getValue("_id")) : `Выбрано: ${rows.length}`,
    items: (rows) => (
        <>
            <RoomContextMenuItems rows={rows}/>
        </>
    )
};

const UserContextMenuItems = ({ rows }: { rows: Row<{ _id: string }>[] }) => {
    const setPasswordChangeDialogOpen = useSetAtom(showPasswordChangeDialogAtom)
    const setAddUserInRoomDialogOpen = useSetAtom(showAddUserInRoomDialogAtom)
    const setSelectedUsersData = useSetAtom($selectedUsersData)
    const data = rows.map(it => ({
        _id: it.getValue('_id') as string,
        username: it.getValue('username') as string
    }))
    return (
        <>
            <ContextMenuItem>Добавить в команду</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setAddUserInRoomDialogOpen(true)
            }}>Добавить в комнату</ContextMenuItem>
            <ContextMenuItem>Удалить из команды</ContextMenuItem>
            <ContextMenuItem>Удалить из комнаты</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setPasswordChangeDialogOpen(true)
            }}>Сменить пароль</ContextMenuItem>
            <ContextMenuItem>Удалить</ContextMenuItem>
            {rows.length === 1 && <ContextMenuItem>Управление</ContextMenuItem>}
        </>
    )
};

export const userContextMenuConfig: ContextMenuConfig<{
    _id: string
}> = {
    getLabel: (rows) =>
        rows.length === 1 ? rows[0].getValue("username") : `Выбрано: ${rows.length}`,
    items: (rows) => (
        <>
            <UserContextMenuItems rows={rows}/>
        </>
    )
};

const TeamContextMenuItems = ({ rows }: { rows: Row<{ _id: string }>[] }) => {
    return (
        <>
            <ContextMenuItem>Удалить команды</ContextMenuItem>
            <ContextMenuItem>Добавить участников</ContextMenuItem>
            <ContextMenuItem>Удалить участников</ContextMenuItem>
            <ContextMenuItem>Добавить в комнату</ContextMenuItem>
            <ContextMenuItem>Удалить из комнаты</ContextMenuItem>
            {rows.length === 1 && <ContextMenuItem>Управление</ContextMenuItem>}
        </>
    )
};

export const teamContextMenuConfig: ContextMenuConfig<{
    _id: string
}> = {
    getLabel: (rows) =>
        rows.length === 1 ? rows[0].getValue("name") : `Выбрано: ${rows.length}`,
    items: (rows) => (
        <>
            <TeamContextMenuItems rows={rows}/>
        </>
    )
};
