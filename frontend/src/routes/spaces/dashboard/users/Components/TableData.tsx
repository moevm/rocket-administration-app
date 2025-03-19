import {ColumnDef} from "@tanstack/table-core";
import {User} from "@/store/types/user.ts";
import {
    ColumnFiltersState, flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState
} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Input} from "@/components/ui/input.tsx";
import React from "react";
import {DataTableViewOptions} from "@/components/reusableComponents/DataTableViewOptions.tsx";
import {DataTablePagination} from "@/components/reusableComponents/DataTablePagination.tsx";
import {Button} from "@/components/ui/button.tsx";
import {CheckIcon, Filter, Import, Settings, SettingsIcon} from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: User[]
}

function TableData<TData, TValue>({
                                      columns,
                                      data
                                  }: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({
        })
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    // ДЛЯ ПОГРУЖЕНИЯ В ПОЛЬЗОВАТЕЛЯ
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
            columnFilters,
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),

    })

    const openUserCard = (employee) => {
        setSelectedUser(employee);
        setIsModalOpen(true);
    };

    const closeUserCard = () => {
        setSelectedUser(null);
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex">
                <div className={"flex-col flex gap-2 w-full ml-auto py-2"}>
                    <div className={"flex gap-2"}>
                        <Input
                            placeholder="Поиск..."
                            value={(table.getState().globalFilter as string) ?? ""}
                            onChange={(event) => table.setGlobalFilter(event.target.value)}
                            className="max-w-sm"
                        />
                        <Button variant={"outline"}>
                            <SettingsIcon/>
                        </Button>
                        <Button variant={"outline"}>
                            <Filter/>
                        </Button>
                    </div>

                    <div className={"flex gap-2 w-full"}>
                        <div className={"flex gap-2"}>
                            <Button variant={"outline"} size="sm"
                                    className="ml-auto hidden h-8 lg:flex">
                                <Import/> Импорт
                            </Button>
                            <Button variant={"outline"} size="sm"
                                    className="ml-auto hidden h-8 lg:flex">
                                не нашел иконку ищите сами (Экспорт)
                            </Button>
                            <Button variant={"outline"} size="sm"
                                    className="ml-auto hidden h-8 lg:flex">
                                <CheckIcon/> Выделить из файла
                            </Button>
                        </div>

                        <div className={"ml-auto"}>
                            <DataTableViewOptions table={table}/>
                        </div>
                    </div>
                </div>

            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    checked={row.getIsSelected}
                                    onClick={() => openUserCard(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <DataTablePagination table={table} />

            </div>


        </div>
    )

}

export default TableData