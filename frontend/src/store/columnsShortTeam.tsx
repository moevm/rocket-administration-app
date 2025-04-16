import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiTeamModel} from "@/store/global-store.ts";
import {TypedColumnDef} from "@/store/columnsUser.tsx";
import dayjs from 'dayjs';
import {MonoRenderer} from "@/components/app/table/cell/CellRenderers.tsx";
import {CheckboxRenderer} from "@/components/app/ValueRenderers.tsx";


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
] as TypedColumnDef<ApiTeamModel>[]
