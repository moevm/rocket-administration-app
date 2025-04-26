import React from 'react';
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {ContextMenuConfig} from "@/components/app/table/RichTableView.tsx";


export const roomContextMenuConfig: ContextMenuConfig<{
    _id: string
}> = {
    getLabel: (rows) =>
        rows.length === 1 ? (rows[0].getValue("name") ? rows[0].getValue("name") : rows[0].getValue("_id")) : `Выбрано: ${rows.length}`,
    items: (rows) => (
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

export const userContextMenuConfig: ContextMenuConfig<{
    _id: string
}> = {
    getLabel: (rows) =>
        rows.length === 1 ? rows[0].getValue("username") : `Выбрано: ${rows.length}`,
    items: (rows) => (
        <>
            <ContextMenuItem>Добавить в команду</ContextMenuItem>
            <ContextMenuItem>Добавить в комнату</ContextMenuItem>
            <ContextMenuItem>Удалить из команды</ContextMenuItem>
            <ContextMenuItem>Удалить из комнаты</ContextMenuItem>
            <ContextMenuItem>Сменить пароль</ContextMenuItem>
            <ContextMenuItem>Удалить</ContextMenuItem>
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
            <ContextMenuItem>Удалить команды</ContextMenuItem>
            <ContextMenuItem>Добавить участников</ContextMenuItem>
            <ContextMenuItem>Удалить участников</ContextMenuItem>
            <ContextMenuItem>Добавить в комнату</ContextMenuItem>
            <ContextMenuItem>Удалить из комнаты</ContextMenuItem>
            {rows.length === 1 && <ContextMenuItem>Управление</ContextMenuItem>}
        </>
    )
};
