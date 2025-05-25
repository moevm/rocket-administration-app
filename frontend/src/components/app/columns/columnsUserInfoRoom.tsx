import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiUserInfoRoomModel} from "@/store/global-store.ts";
import React from "react";
import {ListRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import {customSortingFn, TypedColumnDef} from "@/lib/table.ts";

const typesName = {
    d: "Личные сообщения",
    c: "Публичный канал",
    p: "Приватный канал",
    l: "Лайвчат",
    v: "Omnichannel VoIP rooms"
}

export const columnsUserInfoRoom = [
    {
        id: "select",
        header: ({table}) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Выбрать всё"
            />
        ),
        cell: ({row}) => (
            <Checkbox
                className="row-select-checkbox"
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Выбрать"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            type: 'none'
        }
    },
    {
        accessorKey: "_id",
        header: DataTableColumnHeader,
        meta: {
            title: "id",
            type: 'string',
            selectFromFile: true,
        },
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />,
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "name",
        header: DataTableColumnHeader,
        meta: {
            title: "Имя",
            type: 'string',
            selectFromFile: true,
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        id: "t",
        header: DataTableColumnHeader,
        accessorFn: (row) => {
            return typesName[row.t] ?? row.t
        },
        meta: {
            title: "Tип",
            type: 'string'
        },
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "rid",
        header: DataTableColumnHeader,
        meta: {
            title: "rid",
            type: 'string',
            selectFromFile: true,
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "roles",
        header: DataTableColumnHeader,
        meta: {
            title: "Роли",
            type: 'list'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <ListRenderer value={cell.getValue()} />
    },
] as TypedColumnDef<ApiUserInfoRoomModel>[]
