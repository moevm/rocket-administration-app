import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiTeamModel} from "@/store/global-store.ts";
import dayjs from 'dayjs';
import {DateRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import {customSortingFn, TypedColumnDef} from "@/lib/table.ts";

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
        sortingFn: customSortingFn,
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "name",
        header: DataTableColumnHeader,
        meta: {
            title: "Имя",
            type: 'string',
            selectFromFile: true,
        },
        sortingFn: customSortingFn
    },
    {
        id: "type",
        header: DataTableColumnHeader,
        accessorFn: (row) => {
            return typesType[row.type]
        },
        meta: {
            title: "Тип",
            type: 'string'
        },
    },
    {
        id: "createdAt",
        header: DataTableColumnHeader,
        accessorFn: (row) => {
            return dayjs(row.createdAt)
        },
        cell: ({ cell }) => <DateRenderer value={cell.getValue()} />,
        meta: {
            title: "Создано в",
            type: 'datetime'
        },
        sortingFn: customSortingFn
    },
    {
        accessorKey: "createdBy._id",
        header: DataTableColumnHeader,
        meta: {
            title: "Создатель",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "updatedAt",
        header: DataTableColumnHeader,
        accessorFn: (row) => {
            return dayjs(row.createdAt)
        },
        meta: {
            title: "Обновлено в",
            type: 'datetime'
        },
        cell: ({ cell }) => <DateRenderer value={cell.getValue()} />,
    },
    {
        accessorKey: "roomId",
        header: DataTableColumnHeader,
        meta: {
            title: "Id комнаты",
            type: 'string',
            selectFromFile: true,
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "rooms",
        header: DataTableColumnHeader,
        meta: {
            title: "Комнаты",
            type: 'number'
        },
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "numberOfUsers",
        header: DataTableColumnHeader,
        meta: {
            title: "Количество пользователей",
            type: 'number'
        },
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
] as TypedColumnDef<ApiTeamModel>[]
