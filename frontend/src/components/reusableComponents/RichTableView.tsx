import * as React from "react";
import {
    ColumnFiltersState, flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel, Row,
    SortingState,
    useReactTable,
    VisibilityState
} from "@tanstack/react-table";
import {Point} from "@/components/custom-radix/context-menu.tsx";
import {useEffect} from "react";
import {ContextMenuLabel} from "@/components/ui/context-menu.tsx";
import {Input} from "@/components/ui/input.tsx";
import {MultiSelect} from "@/components/ui/multi-select.tsx";
import {Button} from "@/components/ui/button.tsx";
import {CheckIcon, FileDown, FileUp, Filter, SettingsIcon} from "lucide-react";
import {DataTableViewOptions} from "@/components/reusableComponents/DataTableViewOptions.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {DataTablePagination} from "@/components/reusableComponents/DataTablePagination.tsx";
import {ColumnDef} from "@tanstack/table-core";
import ExternallyTriggeredContextMenu from "@/components/reusableComponents/ExternallyTriggeredContextMenu.tsx";
import {Label} from "@/components/ui/label.tsx";
import {getColumnTypeRelations, relationFullName} from "@/store/columnsUser.tsx";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover.tsx";
import {FileDialog} from "@/components/reusableComponents/FileDialog.tsx";
import {ExportDialog} from "@/components/reusableComponents/ExportDialog.tsx";



interface RichTableViewProps<TData, TValue> {
    dataAtom: TData[]; // состояние с данными
    tableConfig: {
        columns: ColumnDef<TData, TValue>[];
        globalFilterFn?: any; // кастомный фильтр
    };
    contextMenuConfig: {
        getLabel?: (rows: Row<TData>[]) => string;
        items: (rows: Row<TData>[]) => React.ReactNode;
    };
    settings?: {
        enableSearch?: boolean;
        enableExport?: boolean;
        enableColumnVisibilityToggle?: boolean;
        rowClickHandler?: (data: TData) => void;
    };
}

function RichTableView<TData, TValue>({
                                          dataAtom,
                                          tableConfig,
                                          contextMenuConfig,
                                          settings = {}
                                      }: RichTableViewProps<TData, TValue>) {
    console.info({
        dataAtom
    })
    const data = dataAtom.users;

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [filterString, setFilterString] = React.useState<string>();
    const [searchPosition, setSearchPosition] = React.useState<string[]>([]);

    const contextMenuPosition = React.useRef<Point>({ x: 0, y: 0 });
    const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
    const contextMenuRows = React.useRef<Row<TData>[]>([]);

    const [showDialogImport, setShowDialogImport] = React.useState<boolean>(false);
    const [showDialogExport, setShowDialogExport] = React.useState<boolean>(false);
    const [showDialogSelectFromFile, setShowDialogSelectFromFile] = React.useState<boolean>(false);

    const defaultGlobalFilter = (row, columnId, filterValue) => {
        return row.getValue(columnId)?.toString().toLowerCase().includes(filterValue.toLowerCase());
    };

    const table = useReactTable<TData>({
        data,
        columns: tableConfig.columns,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
            columnFilters
        },
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        globalFilterFn: tableConfig.globalFilterFn || defaultGlobalFilter
    });

    useEffect(() => {
        table.setGlobalFilter(filterString)
    }, [filterString, table, searchPosition]);


    return (
        <div className={"flex w-full flex-col"}>
            <ExternallyTriggeredContextMenu
                open={contextMenuOpen}
                onOpenChange={setContextMenuOpen}
                point={contextMenuPosition.current}
            >
                <ContextMenuLabel>
                    {contextMenuConfig.getLabel
                        ? contextMenuConfig.getLabel(contextMenuRows.current)
                        : "Действия"}
                </ContextMenuLabel>
                {contextMenuConfig.items(contextMenuRows.current)}
            </ExternallyTriggeredContextMenu>

            <div className="flex flex-col gap-2 w-full py-2">
                {!(settings) || settings.enableSearch && (
                    <div className="flex gap-2">
                        <Input
                            placeholder={
                                searchPosition.length
                                    ? "Поиск по " + searchPosition.join(", ")
                                    : "Выберите колонку для поиска"
                            }
                            value={filterString}
                            onChange={(event) => setFilterString(event.target.value)}
                            disabled={searchPosition.length === 0}
                            className="max-w-sm"
                        />
                        <MultiSelect
                            options={table.getAllColumns()
                                .filter(
                                    (column) =>
                                        typeof column.accessorFn !== "undefined" &&
                                        column.getCanHide() &&
                                        column.columnDef.meta.type === 'string'
                                )
                                .map(it => ({
                                    label: it.columnDef.meta?.title || it.id,
                                    value: it.id
                                }))}
                            onValueChange={setSearchPosition}
                            asChild
                        >
                            <Button
                                variant="outline">
                                <SettingsIcon />
                            </Button>
                        </MultiSelect>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline">
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
                                    <Button variant="outline">Добавить фильтр</Button>
                                    <Button variant="outline">Очистить фильтры</Button>
                                    <Button variant="outline">Применить</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                )}


                <div className="flex justify-between">
                    {!(settings) || settings.enableExport && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowDialogExport(true)}>
                                <FileUp/> Экспорт
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowDialogImport(true)}>
                                <FileDown/> Импорт
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowDialogSelectFromFile(true)}>
                                <CheckIcon/> Выделить из файла
                            </Button>
                        </div>
                    )}
                    {settings?.enableColumnVisibilityToggle && <DataTableViewOptions table={table}/>}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    // TODO: проваливание здесь
                                    //onClick={() => settings.rowClickHandler?.(row.original)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        contextMenuPosition.current = {x: e.clientX, y: e.clientY};
                                        const selectedRows = table.getSelectedRowModel().rows as Row<TData>[];
                                        contextMenuRows.current = row.getIsSelected() ? selectedRows : [row as Row<TData>];

                                        setContextMenuOpen(true);
                                    }}
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
                                <TableCell colSpan={tableConfig.columns.length} className="h-24 text-center">
                                    Не найдено
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <DataTablePagination table={table}/>
            </div>

            <FileDialog
                open={showDialogImport}
                onOpenChange={setShowDialogImport}
                title="Импорт"
                buttonText="Импорт"
                onSubmit={()=>{}}
            />

            <FileDialog
                open={showDialogSelectFromFile}
                onOpenChange={setShowDialogSelectFromFile}
                title="Выделить из файла"
                buttonText="Выделить"
                onSubmit={()=>{}}
            />

            <ExportDialog
                open={showDialogExport}
                onOpenChange={setShowDialogExport}
                table={table}
                selectedCount={Object.keys(rowSelection).length}
                data={dataAtom.users}
                // onExport={()=>{}}
            />
        </div>
    );
}

export default RichTableView
