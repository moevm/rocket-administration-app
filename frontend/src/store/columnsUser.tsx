import {User} from "/types/user.ts";
import {ColumnDef} from "@tanstack/table-core";
import DataTableColumnHeader from "@/components/reusableComponents/DataTableColumnHeader.tsx";

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
        accessorKey: "id",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Никнейм" />
            )
        },
        meta: { title: "Фамилия" },
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "nickname",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Никнейм" />
        )
        },
        meta: { title: "Никнейм" },
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Email" />
        )
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
    },
]