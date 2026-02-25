import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiRoomUserModel} from "@/store/global-store.ts";
import React from "react";
import {MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import {customSortingFn, TypedColumnDef} from "@/lib/table.ts";


export const columnsRoomUser = [
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
        cell: ({cell}) => <MonoRenderer value={cell.getValue()}/>,
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
        cell: ({cell}) => <OptRenderer value={cell.getValue()}/>
    },
    {
        accessorKey: "username",
        header: DataTableColumnHeader,
        meta: {
            title: "Логин",
            type: 'string',
            selectFromFile: true,
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()}/>
    },
    {
        accessorKey: "status",
        header: DataTableColumnHeader,
        meta: {
            title: "Статус",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()}/>
    },
    {
        accessorKey: "roles",
        header: DataTableColumnHeader,
        meta: {
            title: "Роли",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={(cell.getValue() as string[] | undefined)?.join(", ") ?? ""}/>
    },
] as TypedColumnDef<ApiRoomUserModel>[]
