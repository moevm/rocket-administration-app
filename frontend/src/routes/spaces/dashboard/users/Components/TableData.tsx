import {ColumnDef} from "@tanstack/table-core";
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
import * as MenuPrimitive from "@radix-ui/react-menu"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {Input} from "@/components/ui/input.tsx";
import * as React from "react";
import {DataTableViewOptions} from "@/components/reusableComponents/DataTableViewOptions.tsx";
import {DataTablePagination} from "@/components/reusableComponents/DataTablePagination.tsx";
import {Button} from "@/components/ui/button.tsx";
import {
    CheckIcon, FileDown,
    FileUp,
    Filter,
    SettingsIcon
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Label} from "@/components/ui/label.tsx";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {getColumnTypeRelations, relationFullName} from "@/store/columnsUser.tsx";
import {ApiUserModel} from "@/store/global-store.ts";
import {MultiSelect} from "@/components/ui/multi-select.tsx";
import {useEffect} from "react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuTrigger
} from "@/components/ui/context-menu.tsx";
import {
    ContextMenuProps,
    ContextMenuProvider,
    ContextMenuTriggerElement,
    ContextMenuTriggerProps, Point, ScopedProps,
    TRIGGER_NAME,
    useContextMenuContext, useMenuScope
} from "@/components/custom-radix/context-menu.tsx";
import {atom, useAtomValue} from "jotai";
import {useSetAtom} from "jotai/react";
import {useCallbackRef} from "@radix-ui/react-use-callback-ref";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: ApiUserModel[]
}

const ExternallyTriggeredContextMenu = (props: ScopedProps<ContextMenuProps & {open: boolean, point: Point}>) => {
    const { __scopeContextMenu, children, onOpenChange, dir, modal = true, open } = props;
    const menuScope = useMenuScope(__scopeContextMenu);
    const handleOpenChangeProp = useCallbackRef(onOpenChange);

    const handleOpenChange = React.useCallback(
        (open: boolean) => {
            handleOpenChangeProp(open);
        },
        [handleOpenChangeProp]
    );

    const point = React.useRef<Point>({x: 0, y: 0})
    const virtualRef = React.useRef({
        getBoundingClientRect: () => DOMRect.fromRect({ width: 0, height: 0, ...point.current }),
    });

    useEffect(() => {
        point.current = props.point
    }, [props.point]);

    return (
        <ContextMenuProvider
            scope={__scopeContextMenu}
            open={open}
            onOpenChange={handleOpenChange}
            modal={modal}
        >
            <MenuPrimitive.Root
                {...menuScope}
                dir={dir}
                open={open}
                onOpenChange={handleOpenChange}
                modal={modal}
            >
                <ContextMenuContent>
                    <MenuPrimitive.Anchor {...menuScope} virtualRef={virtualRef} />
                    {children}
                </ContextMenuContent>
            </MenuPrimitive.Root>
        </ContextMenuProvider>
    );
}

function TableData<TData, TValue>({
                                      columns,
                                      data
                                  }: DataTableProps<TData, TValue>) {

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [searchPosition, setSearchPosition] = React.useState<string[]>([])
    const [filterString, setFilterString] = React.useState<string>()

    // ДЛЯ ПОГРУЖЕНИЯ В ПОЛЬЗОВАТЕЛЯ
    const [selectedUser, setSelectedUser] = React.useState<ApiUserModel | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
    const contextMenuPosition = React.useRef<Point>({x: 0, y: 0})
    const contextMenuRows = React.useRef([])

    const customFilterFn = (rows, columnId, filterValue) => {
        // todo fuzzy search if doing it on client
        if (filterValue.length === 0) {
            return true
        }
        const targetCells = rows.getAllCells().filter(it => {
            return searchPosition.includes(it.column.id)
        })
        return targetCells.some(it => {
            return it.getValue().toLowerCase().includes(filterValue.toLowerCase())
        })
    }

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
        globalFilterFn: customFilterFn
    })

    useEffect(() => {
        table.setGlobalFilter(filterString)
    }, [filterString, table, searchPosition]);

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
            <ExternallyTriggeredContextMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen} point={contextMenuPosition.current}>
                <ContextMenuLabel>{
                    contextMenuRows.current.length === 1 ? (contextMenuRows.current[0].getValue('username')) : ('Выбрано: '+ contextMenuRows.current.length)
                }</ContextMenuLabel>
                <ContextMenuItem>Добавить в команду</ContextMenuItem>
                <ContextMenuItem>Добавить в комнату</ContextMenuItem>
                <ContextMenuItem>Удалить из команды</ContextMenuItem>
                <ContextMenuItem>Удалить из комнаты</ContextMenuItem>
                <ContextMenuItem>Сменить пароль</ContextMenuItem>
                <ContextMenuItem>Удалить</ContextMenuItem>
                {
                    contextMenuRows.current.length === 1 && <>
                        <ContextMenuItem>Управление</ContextMenuItem>
                    </>
                }
            </ExternallyTriggeredContextMenu>

            <div className="flex">
                <div className={"flex-col flex gap-2 w-full ml-auto py-2"}>
                    <div className={"flex gap-2"}>
                        <Input
                            placeholder={searchPosition.length ? "Поиск по " + searchPosition.join(', ') : "Выберите колонку для поиска"}
                            value={filterString}
                            onChange={(event) => {
                                setFilterString(event.target.value)
                            }}
                            className="max-w-sm"
                            disabled={searchPosition.length === 0}
                        />

                        <MultiSelect
                            options={table.getAllColumns()
                                .filter(it => typeof it.accessorFn !== 'undefined' && it.getCanHide() && it.columnDef.meta.type === 'string')
                                .map(it => ({
                                    label: it.columnDef.meta.title,
                                    value: it.id
                                }))}
                            onValueChange={setSearchPosition}
                        />
                        {/*<DropdownMenu>*/}
                        {/*    <DropdownMenuTrigger asChild>*/}
                        {/*        <Button variant={"outline"}>*/}
                        {/*            <SettingsIcon/>*/}
                        {/*        </Button>*/}
                        {/*    </DropdownMenuTrigger>*/}
                        {/*    <DropdownMenuContent align="start">*/}
                        {/*        <DropdownMenuLabel>Поиск по</DropdownMenuLabel>*/}
                        {/*        <DropdownMenuSeparator/>*/}
                        {/*        { //TODO универсальный бы компонент для этого меню и для следующего*/}
                        {/*            table*/}
                        {/*                .getAllColumns()*/}
                        {/*                .filter(*/}
                        {/*                    (column) =>*/}
                        {/*                        typeof column.accessorFn !== "undefined" &&*/}
                        {/*                        column.getCanHide() &&*/}
                        {/*                        column.columnDef.meta.type === 'string'*/}
                        {/*                )*/}
                        {/*                .map((column) => {*/}
                        {/*                    return (*/}
                        {/*                        <DropdownMenuRadioGroup value={searchPosition}*/}
                        {/*                                                onValueChange={setSearchPosition}>*/}
                        {/*                            <DropdownMenuRadioItem*/}
                        {/*                                value={column.id}>{column.columnDef.meta?.title ? column.columnDef.meta.title : column.id}</DropdownMenuRadioItem>*/}
                        {/*                        </DropdownMenuRadioGroup>*/}

                        {/*                    )*/}
                        {/*                })}*/}
                        {/*    </DropdownMenuContent>*/}
                        {/*</DropdownMenu>*/}


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
                            <>
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        checked={row.getIsSelected}
                                        onClick={() => openUserCard(row.original)}
                                        onContextMenu={(event) => {
                                            event.preventDefault()
                                            contextMenuPosition.current = {x:event.clientX, y:event.clientY}
                                            if (row.getIsSelected()) {
                                                contextMenuRows.current = table.getSelectedRowModel().rows
                                            } else {
                                                contextMenuRows.current = [row]
                                            }
                                            setContextMenuOpen(true)
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            //TODO если у юзера несколько ролей, выглядит плохо
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </>
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
