import {ColumnDef} from "@tanstack/table-core";
import {User} from "@/store/types/user.ts";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

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
import * as React from "react";
import {DataTableViewOptions} from "@/components/reusableComponents/DataTableViewOptions.tsx";
import {DataTablePagination} from "@/components/reusableComponents/DataTablePagination.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    CheckIcon, ChevronRight,
    FileDown,
    FileUp,
    Filter,
    SettingsIcon
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
    DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Label} from "@/components/ui/label.tsx";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {getColumnTypeRelations, relationFullName} from "@/store/columnsUser.tsx";

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
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [searchPosition, setSearchPosition] = React.useState()

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
                            //TODO красивое название колонки
                            placeholder={searchPosition ? "Поиск по " + searchPosition : "Выберите колонку для поиска"}
                            value={(table.getColumn(searchPosition)?.getFilterValue() as string) ?? ""}
                            onChange={
                                (event) => {
                                    if (searchPosition) {
                                        table.getColumn(searchPosition)?.setFilterValue(event.target.value)
                                    }
                                }
                            }
                            className="max-w-sm"
                            disabled={!searchPosition}
                        />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant={"outline"}>
                                    <SettingsIcon/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Поиск по</DropdownMenuLabel>
                                <DropdownMenuSeparator/>
                                { //TODO универсальный бы компонент для этого меню и для следующего
                                    table
                                        .getAllColumns()
                                        .filter(
                                            (column) =>
                                                typeof column.accessorFn !== "undefined" &&
                                                column.getCanHide() &&
                                                column.columnDef.meta.type === 'string'
                                        )
                                        .map((column) => {
                                            return (
                                                <DropdownMenuRadioGroup value={searchPosition}
                                                                        onValueChange={setSearchPosition}>
                                                    <DropdownMenuRadioItem
                                                        value={column.id}>{column.columnDef.meta?.title ? column.columnDef.meta.title : column.id}</DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>

                                            )
                                        })}
                            </DropdownMenuContent>
                        </DropdownMenu>


                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"}>
                                    <Filter/>
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-80">
                                <div className="mb-4">
                                    <h4 className="font-medium leading-none">Фильтры</h4>
                                </div>

                                <div className="flex flex-col gap-2 justify-items-stretch">
                                    <Label htmlFor="width">Атрибут</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите атрибут"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {table
                                                    .getAllColumns()
                                                    .filter(
                                                        (column) =>
                                                            typeof column.accessorFn !== "undefined" && column.getCanHide()
                                                    )
                                                    .map((column) => {
                                                        return (
                                                            <SelectItem
                                                                value={column.id}>{column.columnDef.meta?.title ? column.columnDef.meta.title : column.id}</SelectItem>
                                                        )
                                                    })}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    <Label htmlFor="width">Отношение</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите отношение"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {getColumnTypeRelations('number')
                                                    .map((relation) => {
                                                        return (
                                                            <SelectItem
                                                                value={relation}>{relationFullName[relation]}</SelectItem>
                                                        )
                                                    })
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    <Label htmlFor="width">Значение</Label>
                                    <Input
                                        //TODO закончить форму
                                        placeholder="gmail.com"
                                        onChange={
                                            (event) => {
                                            }
                                        }
                                        className="max-w-sm"
                                    />
                                    <Button variant={"outline"}>Добавить фильтр</Button>
                                    <Button variant={"outline"}>Очистить фильтры</Button>
                                    <Button variant={"outline"}>Применить</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className={"flex gap-2 w-full"}>
                        <div className={"flex gap-2"}>
                        <Button variant={"outline"} size="sm"
                                    className="ml-auto hidden h-8 lg:flex">
                                <FileUp/> Экспорт
                            </Button>
                            <Button variant={"outline"} size="sm"
                                    className="ml-auto hidden h-8 lg:flex">
                                <FileDown/> Импорт
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
                                        //TODO если у юзера несколько ролей, выглядит плохо
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Не найдено
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <DataTablePagination table={table}/>
            </div>
        </div>
    )
}

export default TableData