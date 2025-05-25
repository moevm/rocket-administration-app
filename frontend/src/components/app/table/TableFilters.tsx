import {Button} from "@/components/ui/button.tsx";
import {Filter, X} from "lucide-react";
import * as React from "react";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label.tsx";
import {Select, SelectTrigger, SelectGroup, SelectContent, SelectValue, SelectItem} from "@/components/ui/select.tsx";
import {Table} from "@tanstack/react-table";
import {Input} from "@/components/ui/input.tsx";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form.tsx";
import {FilterConfig, getColumnTypeRelations, getRelationArgs, relationFullName, RelationType} from "@/lib/filters.ts"


function FilterDisplay<TData>(
    {
        filter,
        table,
        onEdit,
        onDelete
    }: {
        filter: FilterConfig,
        table: Table<TData>,
        onEdit: () => void,
        onDelete: () => void
    }) {
    const values = Object.values(filter.values)

    return (
        <Button
            variant={"outline"}
            className={"border-primary text-primary hover:text-primary bg-transparent hover:bg-primary/10 pr-3 gap-1"}
            onClick={onEdit}
        >
            <div className={"inline-flex gap-1"}>
                <span>{table.getColumn(filter.columnId).columnDef.meta?.title ?? filter.columnId}</span>
                <span>{relationFullName[filter.relation]}</span>
                {values.length && <span>{
                    (
                        values.length === 1
                            ? String(values[0])
                            : JSON.stringify(values)
                    )
                }</span> || false}
            </div>
            <Button
                variant="ghost"
                className={"text-primary hover:text-background hover:bg-destructive p-1 bg-transparent h-auto"}
                onClick={e => {
                    onDelete()
                    e.stopPropagation()
                }}
            >
                <X/>
            </Button>

        </Button>
    )
}

function FilterDialog<TData>(
    {
        table,
        openEditFilterDialog,
        setOpenEditFilterDialog,
        editingFilter,
        save
    }: {
        table: Table<TData>,
        openEditFilterDialog: boolean,
        setOpenEditFilterDialog: (value: boolean) => void,
        editingFilter: FilterConfig | null,
        save: (value: FilterConfig) => void
    }) {
    const availableColumns = table
        .getAllColumns()
        .filter((column) => typeof column.accessorFn !== "undefined")
    const [columnId, setColumnId] = useState<string>(availableColumns[0].id)
    const [relation, setRelation] = useState<RelationType | null>(null)

    const column = useMemo(() => {
        return availableColumns.find(it => it.id === columnId)
    }, [availableColumns, columnId])

    const columnType = useMemo(() => {
        return column.columnDef.meta?.type ?? 'none'
    }, [column])

    const availableRelations = useMemo(() => {
        return getColumnTypeRelations(columnType)
    }, [columnType])

    useEffect(() => {
        setRelation(availableRelations[0])
    }, [availableRelations]);

    const relationData = useMemo(() => {
        return getRelationArgs(relation ?? 'equals');
    }, [relation])

    const form = useForm({
        context: {
            schema: relationData.schema
        },
        reValidateMode: "onSubmit",
        mode: "all",
        resolver: (...opts) => {
            return zodResolver(opts[1].schema)(...opts)
        }
    })

    useEffect(() => {
        setTimeout(() => {
            form.reset({}, {keepValues: false})
        }, 0)
    }, [relationData]);

    useEffect(() => {
        if (openEditFilterDialog) {
            if (editingFilter) {
                setColumnId(editingFilter.columnId)
                setTimeout(() => {
                    setRelation(editingFilter.relation)
                }, 0)

                form.reset(editingFilter.values)
            } else {
                setColumnId(availableColumns[0].id)
                form.reset({}, {keepValues: false})
            }
        }
    }, [openEditFilterDialog, editingFilter]);

    const onSubmit = useCallback(() => {
        const formValues = form.getValues()
        const result = Object.fromEntries(relationData.fields.map(({key}) => [key, formValues[key]]))
        save({
            columnId,
            relation: relation!,
            values: result
        })
        setOpenEditFilterDialog(false)
    }, [columnId, form, relation, save])

    return (
        <Dialog open={openEditFilterDialog} onOpenChange={setOpenEditFilterDialog}>
            <DialogContent className={"max-w-sm"}>
                <DialogHeader>
                    <DialogTitle>
                        {editingFilter ? 'Изменить фильтр' : 'Добавить фильтр'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2 justify-items-stretch">
                    <Label>Атрибут</Label>
                    <Select value={columnId} onValueChange={setColumnId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите атрибут"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {availableColumns
                                    .map((column) => {
                                        return (
                                            <SelectItem
                                                key={column.id}
                                                value={column.id}>{column.columnDef.meta?.title ? column.columnDef.meta.title : column.id}</SelectItem>
                                        )
                                    })}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Label>Отношение</Label>
                    <Select value={relation} onValueChange={setRelation}>
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите отношение"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {availableRelations
                                    .map((relation) => {
                                        return (
                                            <SelectItem
                                                key={relation}
                                                value={relation}>{relationFullName[relation]}</SelectItem>
                                        )
                                    })
                                }
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Form {...form}>
                        {relationData.fields.map(({key, label}) => {
                            return (
                                <FormField
                                    key={key}
                                    control={form.control}
                                    name={key}
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>{label}</FormLabel>
                                            <FormControl>
                                                <Input {...field}  />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            )
                        })}
                    </Form>
                </div>
                <DialogFooter>
                    <Button className={"w-full"} onClick={form.handleSubmit(onSubmit)}>
                        Сохранить
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function TableFilters<TData>(
    {
        table,
        filters,
        onFiltersUpdated
    }: {
        table: Table<TData>,
        filters: FilterConfig[],
        onFiltersUpdated: (data: FilterConfig[]) => void
    }
) {
    // const [filters, setFilters] = useState<FilterConfig[]>([]);
    const [openEditFilterDialog, setOpenEditFilterDialog] = useState(false);
    const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(null)

    const editingFilter = useMemo(() => {
        return ((editingFilterIndex !== null) && filters[editingFilterIndex!]) || null
    }, [filters, editingFilterIndex])

    const addFilter = useCallback(() => {
        setOpenEditFilterDialog(true)
    }, [])

    return (
        <div className="flex flex-wrap gap-2">
            <FilterDialog
                table={table}
                openEditFilterDialog={openEditFilterDialog}
                setOpenEditFilterDialog={(value) => {
                    setOpenEditFilterDialog(false)
                    if (!value && editingFilter !== null) {
                        setEditingFilterIndex(null)
                    }
                }}
                editingFilter={editingFilter}
                save={(filter) => {
                    if (editingFilter === null) {
                        onFiltersUpdated([...filters, filter]);
                    } else {
                        onFiltersUpdated(filters.map((f, i) => {
                            if (i === editingFilterIndex) {
                                return filter
                            } else {
                                return f
                            }
                        }))
                    }
                }}
            />
            <Button variant="outline" onClick={() => addFilter()}>
                <Filter/>
                Добавить фильтр
            </Button>
            {filters.map(((filter, i) => (
                <FilterDisplay
                    key={i}
                    table={table}
                    filter={filter}
                    onEdit={() => {
                        setEditingFilterIndex(i)
                        setOpenEditFilterDialog(true)
                    }}
                    onDelete={() => {
                        onFiltersUpdated(filters.filter((_, index) => {
                            return index !== i
                        }))
                    }}
                />
            )))}
        </div>
    )
}

export default TableFilters
