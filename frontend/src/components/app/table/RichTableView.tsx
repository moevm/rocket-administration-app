import * as React from "react";
import {
    ColumnFiltersState, FilterFn, flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel, getSortedRowModel, Row, SortingState,
    useReactTable,
    VisibilityState
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {Input} from "@/components/ui/input.tsx";
import {MultiSelect} from "@/components/ui/multi-select.tsx";
import {Button} from "@/components/ui/button.tsx";
import {CheckIcon, FileDown, FileUp, SettingsIcon} from "lucide-react";
import {DataTableViewOptions} from "@/components/app/table/DataTableViewOptions.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";
import {DataTablePagination} from "@/components/app/table/DataTablePagination.tsx";
import {ColumnDef} from "@tanstack/table-core";
import {ExportDialog} from "@/components/app/dialogs/ExportDialog.tsx";
import {FileDialog} from "@/components/app/dialogs/FileDialog.tsx";
import {toast} from "sonner";
import {UserImportDialog} from "@/components/app/dialogs/UserImportDialog.tsx";
import TableFilters from "@/components/app/table/TableFilters.tsx";
import {FilterConfig, performFilter} from "@/lib/filters.ts";
import {FilterMeta} from "@tanstack/table-core/src/types.ts";
import {useAtom, useSetAtom} from "jotai";
import {$hideColumnsAtomFamily, $searchColumnsAtomFamily, contextMenuDataAtom, showContextMenuAtom} from "@/store/global-store.ts";
import {useAtomValue} from "jotai";

export interface ContextMenuConfig<TData> {
    getLabel?: (rows: Row<TData>[]) => string;
    items: (rows: Row<TData>[]) => React.ReactNode;
}

interface RichTableViewProps<TData, TValue> {
    tableId: string,
    entries: TData[]; // состояние с данными
    tableConfig: {
        columns: ColumnDef<TData, TValue>[];
        globalFilterFn?: any; // кастомный фильтр
    };
    contextMenuConfig: ContextMenuConfig<TData>
    settings?: {
        enableSearch?: boolean;
        enableExport?: boolean;
        enableImport?: boolean;
        enableColumnVisibilityToggle?: boolean;
        rowClickHandler?: (data: TData) => void;
    };
    onSelectionUpdated?: (data: Row<TData>[]) => void;
    buttonsSlot?: () => React.ReactNode;
}

function RichTableView<TData, TValue>({
                                          tableId,
                                          entries,
                                          tableConfig,
                                          contextMenuConfig,
                                          settings = {},
                                          onSelectionUpdated,
                                          buttonsSlot
                                      }: RichTableViewProps<TData, TValue>) {
    const data = entries;

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [filterString, setFilterString] = React.useState<string>();
    const [searchColumns, setSearchColumns] = useAtom($searchColumnsAtomFamily(tableId))

    const setContextMenuData = useSetAtom(contextMenuDataAtom);
    const setContextMenuOpen = useSetAtom(showContextMenuAtom);

    const [showDialogExport, setShowDialogExport] = React.useState<boolean>(false);
    const [showDialogImport, setShowDialogImport] = React.useState<boolean>(false);
    const [showDialogSelectFromFile, setShowDialogSelectFromFile] = React.useState<boolean>(false);

    const [showOnlySelected, setShowOnlySelected] = React.useState<boolean>(false);

    const [globalFilter, setGlobalFilter] = React.useState({
        filterString: "",
        showOnlySelected: false,
        searchColumns: [] as string[],
    });

    useEffect(() => {
        setGlobalFilter({ filterString: filterString ?? "", showOnlySelected, searchColumns });
    }, [filterString, showOnlySelected, searchColumns]);

    const customGlobalFilterFn: FilterFn<TData> = useCallback(
        (row: Row<TData>, columnId: string, filterValue): boolean => {
            const { filterString: search, showOnlySelected: onlySelected, searchColumns: cols } = filterValue;

            if (onlySelected && !row.getIsSelected()) return false;

            const searchTerm = search.toLowerCase().trim();
            if (!searchTerm) return true;
            if (cols.length === 0 || !cols.includes(columnId)) return false;

            return String(row.getValue(columnId)).toLowerCase().includes(searchTerm);
        },
        []
    );

    const table = useReactTable<TData>({
        data,
        columns: tableConfig.columns,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
            columnFilters,
            globalFilter
        },
        onSortingChange: setSorting,
        onRowSelectionChange: data => {
            setRowSelection(data)
            setTimeout(() => {
                onSelectionUpdated?.(table.getSelectedRowModel().rows)
            }, 0)
        },
        onColumnVisibilityChange: setColumnVisibility,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableGlobalFilter: true,
        globalFilterFn: customGlobalFilterFn,
        defaultColumn: {
            filterFn(
                row: Row<TData>,
                columnId: string,
                filterValue: FilterConfig[],
                addMeta: (meta: FilterMeta) => void
            ) {
                if (!filterValue.length) {
                    return true;
                }
                return filterValue.every(it => performFilter(
                    it,
                    row.getValue(columnId)
                ))
            },
            enableColumnFilter: true
        }
    });


    const [hiddenColumns, setHiddenColumns] = useAtom($hideColumnsAtomFamily(tableId))

    const allTableColumns = useMemo(() => {
        return table.getAllColumns()
            .filter(
                (column) =>
                    typeof column.accessorFn !== "undefined" && column.getCanHide()
            )
    }, [table])

    const visibleColumns = useMemo(() => {
        return allTableColumns.filter(it => !hiddenColumns.includes(it.id)).map(it => it.id)
    }, [allTableColumns, hiddenColumns])

    const setVisibleColumns = useCallback((newVisibleColumns: string[]) => {
        setHiddenColumns(
            allTableColumns
                .filter(it => !newVisibleColumns.includes(it.id))
                .map(it => it.id)
        )

    }, [allTableColumns, setHiddenColumns])

    useEffect(() => {
        for (const col of allTableColumns) {
            col.toggleVisibility(visibleColumns.includes(col.id))
        }
    }, [allTableColumns, visibleColumns]);

    const [tableFilters, setTableFilters] = React.useState<FilterConfig[]>([])
    const updateTableFilters = useCallback((filters: FilterConfig[]) => {
        const filtersByColumn = new Map()
        filters.map(filter => {
            if (!filtersByColumn.has(filter.columnId)) {
                filtersByColumn.set(filter.columnId, [])
            }
            filtersByColumn.get(filter.columnId).push(filter)
        })
        for (const col of table.getAllColumns()) {
            if (filtersByColumn.has(col.id)) {
                col.setFilterValue(filtersByColumn.get(col.id))
            } else {
                col.setFilterValue([])
            }
        }
        setTableFilters(filters)
    }, [])

    useEffect(() => {
        updateTableFilters([])
    }, []);

    const selectedRows = table.getSelectedRowModel().rows;
    const selectedCount = selectedRows.length;
    const selectedButtonRef = useRef<HTMLButtonElement>(null);

    return (
        <div className={"flex w-full flex-col"}>
            <div className="flex flex-col gap-2 w-full py-2">
                {!(settings) || settings.enableSearch && (
                    <div className="flex gap-2">
                        <Input
                            placeholder={
                                searchColumns.length
                                    ? "Поиск по " + searchColumns.map(id => {
                                    const column = table.getAllColumns().find(col => col.id === id);
                                    return column?.columnDef.meta?.title || id;
                                }).join(", ")
                                    : "Выберите колонку для поиска"
                            }
                            value={filterString}
                            onChange={(event) => setFilterString(event.target.value)}
                            disabled={searchColumns.length === 0}
                            className="max-w-sm"
                        />
                        <MultiSelect
                            asChild
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
                            defaultValue={searchColumns}
                            onValueChange={setSearchColumns}
                        >
                            <Button variant={"outline"}>
                                <SettingsIcon/>
                            </Button>
                        </MultiSelect>
                    </div>
                )}

                <TableFilters 
                    table={table} 
                    filters={tableFilters} 
                    onFiltersUpdated={updateTableFilters}
                    showOnlySelected={showOnlySelected}
                    onShowOnlySelectedChange={setShowOnlySelected}
                />
                <div className="flex justify-between">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowDialogExport(true)}>
                            <FileUp/> Экспорт
                        </Button>
                        {settings?.enableImport &&
                            <Button variant="outline" size="sm" onClick={() => setShowDialogImport(true)}>
                                <FileDown/> Импорт
                            </Button>}
                        <Button variant="outline" size="sm" onClick={() => setShowDialogSelectFromFile(true)}>
                            <CheckIcon/> Выделить из файла
                        </Button>

                        <Button
                            ref={selectedButtonRef}
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                if (selectedCount === 0) return;
                                setContextMenuData({
                                    point: { x: e.clientX, y: e.clientY },
                                    rows: selectedRows,
                                    config: contextMenuConfig,
                                });
                                setContextMenuOpen(true);
                            }}
                            disabled={selectedCount === 0}
                        >
                            <CheckIcon className="mr-2 h-4 w-4" />
                            Выделено: {selectedCount}
                        </Button>

                        {buttonsSlot && buttonsSlot()}
                    </div>
                    {settings?.enableColumnVisibilityToggle && <DataTableViewOptions allTableColumns={allTableColumns} visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns}/>}
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
                                            : flexRender(header.column.columnDef.header, {...header.getContext() })}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    className={"cursor-pointer"}
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    // TODO: проваливание здесь
                                    onClick={(e) => {
                                        const isCheckboxClick = (e.target as HTMLElement).closest('.row-select-checkbox');
                                        if (!isCheckboxClick && settings.rowClickHandler) {
                                            settings.rowClickHandler(row.original);
                                        }
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        const selectedRows = table.getSelectedRowModel().rows as Row<TData>[];
                                        const rows = row.getIsSelected() ? selectedRows : [row as Row<TData>];
                                        setContextMenuData({
                                            point: { x: e.clientX, y: e.clientY },
                                            rows,
                                            config: {
                                                getLabel: contextMenuConfig.getLabel,
                                                items: contextMenuConfig.items,
                                            },
                                        });
                                        setContextMenuOpen(true);
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={"whitespace-nowrap"}>
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

            <ExportDialog
                open={showDialogExport}
                onOpenChange={setShowDialogExport}
                table={table}
                selectedCount={Object.keys(rowSelection).length}
                data={(table.getSelectedRowModel().rows as Row<TData>[]).map(it => it.original)}
            />
            <FileDialog
                open={showDialogSelectFromFile}
                dialogStep={1}
                onOpenChange={setShowDialogSelectFromFile}
                title={"Выделить из файла"}
                description={"Будут выделены все строки с совпадениями основных полей"}
                buttonText={"Выделить из файла"}
                onSubmit={(data) => {
                    const matches = new Set(data.flatMap(it => Object.values(it).map(it => String(it).toLowerCase())))

                    const cols = table.getAllColumns()
                        .filter(
                            (column) =>
                                column.columnDef.meta.selectFromFile === true
                        )

                    let count = 0
                    table.getPrePaginationRowModel().rows.forEach(row => {
                        if (cols.some(it => {
                            const value = row.getValue(it.id)
                            return matches.has(String(value).toLowerCase())
                        })) {
                            row.toggleSelected(true)
                            count++
                        }
                    })

                    toast.success(`Выделено строк: ${count}`)
                    return true
                }}
            />
            <UserImportDialog
                open={showDialogImport}
                onOpenChange={setShowDialogImport}
            />
        </div>
    );
}

export default RichTableView