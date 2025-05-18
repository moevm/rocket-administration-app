import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiUserModel} from "@/store/global-store.ts";
import {CheckboxRenderer, ListRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import {customSortingFn, TypedColumnDef} from "@/lib/table.ts";

const typesUserType = {
    'bot': "Бот",
    'user': "Пользователь"
}

export const columnsUser = [
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
        accessorKey: "username",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Никнейм"/>
            )
        },
        meta: {
            title: "Никнейм",
            type: 'string',
            selectFromFile: true,
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        accessorKey: 'name',
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
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        id: "emails",
        accessorFn: (row) => {
            if (Array.isArray(row.emails) && row.emails.length > 0) {
                return row.emails[0].address; // Возвращаем адрес первого email
            }
            return "–";
        },
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Email"/>
            );
        },
        meta: {
            title: "Email",
            type: 'list',
        },
        sortingFn: customSortingFn,
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
            type: 'list'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
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
        cell: ({cell}) => <ListRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "active",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Активен"/>
            )
        },
        meta: {
            title: "Активен",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        id: "type",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Тип"/>
            )
        },
        accessorFn: (row) => {
            return typesUserType[row.type] ?? row.type
        },
        meta: {
            title: "Тип",
            type: 'string'
        },
    },
] as TypedColumnDef<ApiUserModel>[]
