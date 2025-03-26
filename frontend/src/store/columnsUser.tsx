import {ColumnDef} from "@tanstack/table-core";
import DataTableColumnHeader from "@/components/reusableComponents/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {User} from "@/store/types/user.ts";
import {RowData} from "@tanstack/table-core/src/types.ts";
import {ColumnMeta} from "@tanstack/react-table";

// TODO точно куда-то переместить (весь файл)

// TODO а это куда-нибудь вынести
export type ColumnType = 'string' | 'number' | 'list' | 'none'
export type TypedColumnDef<T extends RowData> = ColumnDef<T> & { meta: ColumnMeta<T, unknown> & { type: ColumnType } }

export const getColumnTypeRelations: (type: ColumnType) => string[] = type => {
    switch (type) {
        case 'string':
            return ['includes', 'not-includes', 'equals', 'not-equals']
        case 'number':
            return ['eq', 'not-eq', 'gt', 'lt', 'ge', 'le']
        case 'list':
            return []
        default:
            return []
    }
}

export const relationFullName = {
    'includes': "включает",
    'not-includes': "не включает",
    'equals': "соответствует",
    'not-equals': "не соответствует",
    'eq': "равно",
    'not-eq': "не равно",
    'gt': "больше, чем",
    'lt': "меньше, чем",
    'ge': "больше или равно",
    'le': "меньше или равно"
}

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
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({row}) => row.original?.username || "-",
    },
    {
        id: "emails",
        accessorFn: (row) => {
            if (Array.isArray(row.emails) && row.emails.length > 0) {
                return row.emails[0].address; // Возвращаем адрес первого email
            }
            return "Нет email";
        },
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Email"/>
            );
        },
        meta: {
            title: "Email",
            type: 'list'
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
        cell: ({row}) => row.original?.status || "-",
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
        cell: ({row}) => row.original?.roles || "-",
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
    },
    {
        accessorKey: "type",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Тип"/>
            )
        },
        meta: {
            title: "Тип",
            type: 'string'
        },
    },
] as TypedColumnDef<User>[]