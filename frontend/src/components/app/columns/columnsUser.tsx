import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiUserModel} from "@/store/global-store.ts";
import {
    CheckboxRenderer,
    DateRenderer,
    ListRenderer,
    MonoRenderer,
    OptRenderer
} from "@/components/app/ValueRenderers.tsx";
import {customSortingFn, TypedColumnDef} from "@/lib/table.ts";
import dayjs from "dayjs";

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
        accessorKey: "username",
        header: DataTableColumnHeader,
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
        id: "emails",
        accessorFn: (row) => {
            if (Array.isArray(row.emails) && row.emails.length > 0) {
                return row.emails[0].address; // Возвращаем адрес первого email
            }
            return "–";
        },
        header: DataTableColumnHeader,
        meta: {
            title: "Email",
            type: 'list',
            selectFromFile: true
        },
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "status",
        header: DataTableColumnHeader,
        meta: {
            title: "Статус",
            type: 'list'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
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
    {
        accessorKey: "active",
        header: DataTableColumnHeader,
        meta: {
            title: "Активен",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        id: "type",
        header: DataTableColumnHeader,
        accessorFn: (row) => {
            return typesUserType[row.type] ?? row.type
        },
        meta: {
            title: "Тип",
            type: 'string'
        },
    },
    {
        id: "lastLogin",
        header: DataTableColumnHeader,
        accessorFn: (row) => {
            return dayjs(row.lastLogin);
        },
        cell: ({ cell }) => <DateRenderer value={cell.getValue()} />,
        meta: {
            title: 'Последний логин',
            type: 'datetime'
        }
    }
] as TypedColumnDef<ApiUserModel>[]
