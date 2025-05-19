import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiShortTeamModel} from "@/store/global-store.ts";
import {MonoRenderer} from "@/components/app/ValueRenderers.tsx";
import {customSortingFn, TypedColumnDef} from "@/lib/table.ts";

const typesType = {
    "1": "Закрытый канал",
    "0": "Открытый канал"
}

export const columnsShortTeam = [
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
        sortingFn: customSortingFn,
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />
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
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />
    },
] as TypedColumnDef<ApiShortTeamModel>[]
