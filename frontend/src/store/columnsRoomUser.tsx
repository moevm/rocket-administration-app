import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiRoomUserModel} from "@/store/global-store.ts";
import {TypedColumnDef} from "@/store/columnsUser.tsx";
import React from "react";
import {MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";


//TODO: вынести в отдельный компонент
const customSortingFn = (rowA, rowB, columnId) => {
    const getValue = (row) => {
        const value = row.getValue(columnId);
        if (value === undefined || value === null) return "";
        return String(value);
    };

    const a = getValue(rowA);
    const b = getValue(rowB);

    if (a === b) return 0;
    if (a === "+" || a === "-") return 1;
    if (b === "+" || b === "-") return -1;

    return a.localeCompare(b, "ru", {numeric: true});
};

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
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="id"/>
            )
        },
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
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Имя"/>
            )
        },
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
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Логин"/>
            )
        },
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
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Статус"/>
            )
        },
        meta: {
            title: "Статус",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()}/>
    },
] as TypedColumnDef<ApiRoomUserModel>[]
