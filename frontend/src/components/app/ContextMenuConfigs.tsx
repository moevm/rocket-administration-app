import React from 'react';
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {ContextMenuConfig} from "@/components/app/table/RichTableView.tsx";
import {showPasswordChangeDialogAtom} from "@/components/app/dialogs/user-page-dialogs/PasswordChangeDialog.tsx";
import {useSetAtom} from "jotai/react";
import {$selectedRoomsData, $selectedTeamsData, $selectedUsersData, showContextMenuAtom} from "@/store/global-store.ts";
import {Row} from "@tanstack/react-table";
import {showAddUserInRoomDialogAtom} from "@/components/app/dialogs/user-page-dialogs/AddUserInRoomDialog.tsx";
import {showAddUserInTeamDialogAtom} from "@/components/app/dialogs/user-page-dialogs/AddUserInTeamDialog.tsx";
import {
    showDeleteUserFromRoomDialogAtom
} from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromRoomDialog.tsx";
import {
    showDeleteUserFromTeamDialogAtom
} from "@/components/app/dialogs/user-page-dialogs/DeleteUserFromTeamDialog.tsx";
import {showDeleteUserDialogAtom} from "@/components/app/dialogs/user-page-dialogs/DeleteUserDialog.tsx";
import {showAddRoomsToUsersDialogAtom} from "@/components/app/dialogs/room-page-dialogs/AddRoomsToUsersDialog.tsx";
import {
    showDeleteUsersOutOfRoomDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteUsersOutOfRoomsDialog.tsx";
import {showAddTeamsToRoomsDialogAtom} from "@/components/app/dialogs/room-page-dialogs/AddTeamsToRoomsDialog.tsx";
import {
    showDeleteTeamsOutOfRoomsDialogAtom
} from "@/components/app/dialogs/room-page-dialogs/DeleteTeamsOutOfRoomsDialog.tsx";
import {showHideRoomDialogAtom} from "@/components/app/dialogs/room-page-dialogs/HideRoomDialog.tsx";
import {showDeleteRoomDialogAtom} from "@/components/app/dialogs/room-page-dialogs/DeleteRoomDialog.tsx";
import {showAddUsersToTeamDialogAtom} from "@/components/app/dialogs/team-page-dialogs/AddUsersToTeamDialog.tsx";
import {
    showDeleteUsersOutOfTeamDialogAtom
} from "@/components/app/dialogs/team-page-dialogs/DeleteUsersOutOfTeamDialog.tsx";
import {showAddTeamIntoRoomDialogAtom} from "@/components/app/dialogs/team-page-dialogs/AddTeamIntoRoomDialog.tsx";
import {
    showDeleteTeamFromRoomDialogAtom
} from "@/components/app/dialogs/team-page-dialogs/DeleteTeamFromRoomDialog.tsx";
import {showDeleteTeamDialogAtom} from "@/components/app/dialogs/team-page-dialogs/DeleteTeamDialog.tsx";
import {useNavigate} from "react-router";

const RoomContextMenuItems = ({rows}: { rows: Row<{ _id: string }>[] }) => {

    const setAddRoomToUsersDialogOpen = useSetAtom(showAddRoomsToUsersDialogAtom)
    const setDeleteUsersOutOfRoomDialogOpen = useSetAtom(showDeleteUsersOutOfRoomDialogAtom)
    const setAddTeamsToRoomsDialogOpen = useSetAtom(showAddTeamsToRoomsDialogAtom)
    const setDeleteTeamsOutOfRoomsDialogOpen = useSetAtom(showDeleteTeamsOutOfRoomsDialogAtom)
    const setHideRoomsDialogOpen = useSetAtom(showHideRoomDialogAtom)
    const setDeleteRoomsDialogOpen = useSetAtom(showDeleteRoomDialogAtom)
    const setContextMenuOpen = useSetAtom(showContextMenuAtom)
    const nav = useNavigate();

    const setSelectedRoomsData = useSetAtom($selectedRoomsData)
    const data = rows.map(it => ({
        _id: it.getValue('_id') as string
    }))

    return (
        <>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setAddRoomToUsersDialogOpen(true)
                setContextMenuOpen(false)
            }}>Добавить участников</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setDeleteUsersOutOfRoomDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить участников</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setAddTeamsToRoomsDialogOpen(true)
                setContextMenuOpen(false)
            }}>Добавить команды</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setDeleteTeamsOutOfRoomsDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить команды</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setHideRoomsDialogOpen(true)
                setContextMenuOpen(false)
            }}>Скрыть комнату</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setDeleteRoomsDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить комнату</ContextMenuItem>
            {rows.length === 1 && <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setContextMenuOpen(false)
                nav(`${data[0]._id}`)
            }}>Управление</ContextMenuItem>}
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

const UserContextMenuItems = ({rows}: { rows: Row<{ _id: string }>[] }) => {
    const setPasswordChangeDialogOpen = useSetAtom(showPasswordChangeDialogAtom)
    const setAddUserInRoomDialogOpen = useSetAtom(showAddUserInRoomDialogAtom)
    const setAddUserInTeamDialogOpen = useSetAtom(showAddUserInTeamDialogAtom)
    const setDeleteUserFromRoomDialogOpen = useSetAtom(showDeleteUserFromRoomDialogAtom)
    const setDeleteUserFromTeamDialogOpen = useSetAtom(showDeleteUserFromTeamDialogAtom)
    const setDeleteUserDialogOpen = useSetAtom(showDeleteUserDialogAtom)
    const setSelectedUsersData = useSetAtom($selectedUsersData)
    const setContextMenuOpen = useSetAtom(showContextMenuAtom)
    const nav = useNavigate();
    const data = rows.map(it => ({
        _id: it.getValue('_id') as string,
        username: it.getValue('username') as string
    }))
    return (
        <>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setAddUserInTeamDialogOpen(true)
                setContextMenuOpen(false)
            }}>Добавить в команду</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setAddUserInRoomDialogOpen(true)
                setContextMenuOpen(false)
            }}>Добавить в комнату</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setDeleteUserFromTeamDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить из команды</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setDeleteUserFromRoomDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить из комнаты</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setPasswordChangeDialogOpen(true)
                setContextMenuOpen(false)
            }}>Сменить пароль</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setDeleteUserDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить</ContextMenuItem>
            {rows.length === 1 && <ContextMenuItem onClick={() => {
                setSelectedUsersData(data)
                setContextMenuOpen(false)
                nav(`${data[0]._id}`)
            }}>Управление</ContextMenuItem>}
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

const TeamContextMenuItems = ({rows}: { rows: Row<{ _id: string }>[] }) => {
    const setAddUsersToTeamDialogOpen = useSetAtom(showAddUsersToTeamDialogAtom)
    const setDeleteUsersOutOfTeamDialogOpen = useSetAtom(showDeleteUsersOutOfTeamDialogAtom)
    const setAddTeamIntoRoomDialogOpen = useSetAtom(showAddTeamIntoRoomDialogAtom)
    const setDeleteTeamFromRoomDialogOpen = useSetAtom(showDeleteTeamFromRoomDialogAtom)
    const setDeleteTeamDialogOpen = useSetAtom(showDeleteTeamDialogAtom)
    const setContextMenuOpen = useSetAtom(showContextMenuAtom)
    const nav = useNavigate();

    const setSelectedRoomsData = useSetAtom($selectedTeamsData)
    const data = rows.map(it => ({
        _id: it.getValue('_id') as string
    }))

    return (
        <>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setAddUsersToTeamDialogOpen(true)
                setContextMenuOpen(false)
            }}>Добавить участников</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setDeleteUsersOutOfTeamDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить участников</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setAddTeamIntoRoomDialogOpen(true)
                setContextMenuOpen(false)
            }}>Добавить в комнату</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setDeleteTeamFromRoomDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить из комнаты</ContextMenuItem>
            <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setDeleteTeamDialogOpen(true)
                setContextMenuOpen(false)
            }}>Удалить команду</ContextMenuItem>
            {rows.length === 1 && <ContextMenuItem onClick={() => {
                setSelectedRoomsData(data)
                setContextMenuOpen(false)
                nav(`${data[0]._id}`)
            }}>Управление</ContextMenuItem>}
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
