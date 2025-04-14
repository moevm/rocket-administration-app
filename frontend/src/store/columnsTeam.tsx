import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiTeamModel} from "@/store/global-store.ts";
import {TypedColumnDef} from "@/store/columnsUser.tsx";
import dayjs from 'dayjs';
import {MonoRenderer} from "@/components/app/table/cell/CellRenderers.tsx";


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

const typesType = {
    "1": "Закрытый канал",
    "0": "Открытый канал"
}

export const columnsTeam = [
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
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: MonoRenderer()
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
            type: 'string'
        },
        sortingFn: customSortingFn
    },
    {
        id: "type",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Тип"/>
            )
        },
        accessorFn: (row) => {
            return typesType[row.type]
        },
        meta: {
            title: "Тип",
            type: 'boolean'
        },
    },
    {
        id: "createdAt",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Создано в"/>
            )
        },
        accessorFn: (row) => {
            return dayjs(row.createdAt)
        },
        meta: {
            title: "Создано в",
            type: 'string'
        },
        sortingFn: customSortingFn
    },
    {
        accessorKey: "createdBy._id",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Создатель"/>
            )
        },
        meta: {
            title: "Создатель",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: MonoRenderer()
    },
    {
        accessorKey: "updatedAt",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Обновлено в"/>
            )
        },
        meta: {
            title: "Обновлено в",
            type: 'boolean'
        },
        cell: ({row}) => row.original?.updatedAt || "–",
    },
    {
        accessorKey: "roomId",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Id комнаты"/>
            )
        },
        meta: {
            title: "Id комнаты",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: MonoRenderer()
    },
    {
        accessorKey: "rooms",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Комнаты"/>
            )
        },
        meta: {
            title: "Комнаты",
            type: 'number'
        },
    },
    {
        accessorKey: "numberOfUsers",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Количество пользователей"/>
            )
        },
        meta: {
            title: "Количество пользователей",
            type: 'number'
        },
    },
] as TypedColumnDef<ApiTeamModel>[]
