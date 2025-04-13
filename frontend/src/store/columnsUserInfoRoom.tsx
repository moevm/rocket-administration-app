import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiRoomModel} from "@/store/global-store.ts";
import {TypedColumnDef} from "@/store/columnsUser.tsx";
import {CheckboxRenderer, ListRenderer, MonoRenderer, OptRenderer} from "@/components/app/table/cell/CellRenderers.tsx";


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
        cell: MonoRenderer(),
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
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: OptRenderer(),
    },
    {
        id: "t",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Тип"/>
            )
        },
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
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="rid"/>
            )
        },
        meta: {
            title: "rid",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: MonoRenderer(),
    },
    {
        accessorKey: "roles",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Роли"/>
            )
        },
        meta: {
            title: "Роли",
            type: 'list'
        },
        sortingFn: customSortingFn,
        cell: ListRenderer(),
    },
] as TypedColumnDef<ApiRoomModel>[]
