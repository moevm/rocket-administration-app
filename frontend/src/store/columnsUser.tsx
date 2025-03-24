import {ColumnDef} from "@tanstack/table-core";
import DataTableColumnHeader from "@/components/reusableComponents/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {User} from "@/store/types/user.ts";

const customSortingFn = (rowA, rowB, columnId) => {
    console.log("RowA:", rowA.original);
    console.log("RowB:", rowB.original);
    const getValue = (row) => {
        const value = row.getValue(columnId);

        if (value === undefined || value === null) return "";
        if (value === "+" || value === "-") return value;

        return String(value);
    };

    const a = getValue(rowA);
    const b = getValue(rowB);

    if (a === "+" && b !== "+") return 1;
    if (b === "+" && a !== "+") return -1;
    if (a === "-" && b !== "-") return 1;
    if (b === "-" && a !== "-") return -1;

    return a.localeCompare(b, "ru", { numeric: true });
};

export const columnsUser: ColumnDef<User>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Выбрать всё"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Выбрать"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "_id",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="id" />
            )
        },
        meta: { title: "id" },
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "username",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Никнейм" />
        )
        },
        meta: { title: "Никнейм" },
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
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Email" />
            );
        },
        meta: { title: "Email" },
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "status",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Статус" />
        )
        },
        meta: { title: "Статус" },
        sortingFn: customSortingFn,
        cell: ({row}) => row.original?.status || "-",
    },
    {
        accessorKey: "roles",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Роли" />
        )
        },
        meta: { title: "Роли" },
        sortingFn: customSortingFn,
        cell: ({row}) => row.original?.roles || "-",
    },
]