"use client"

import {DropdownMenuTrigger} from "@radix-ui/react-dropdown-menu"
import {Column, Table} from "@tanstack/react-table"
import {Settings2} from "lucide-react"

import {Button} from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {MultiSelect} from "@/components/ui/multi-select.tsx";
import {useAtom} from "jotai/index";
import {$hideColumnsAtomFamily, $searchColumnsAtomFamily} from "@/store/global-store.ts";
import {useCallback, useEffect, useMemo} from "react";

interface DataTableViewOptionsProps<TData> {
    allTableColumns: Column<TData, unknown>[]
    visibleColumns: string[],
    setVisibleColumns: (value: string[]) => void
}

export function DataTableViewOptions<TData>(
    {
        allTableColumns,
        visibleColumns,
        setVisibleColumns
    }: DataTableViewOptionsProps<TData>
) {

    return (
        <MultiSelect
            asChild
            options={
                allTableColumns
                    .map((it) => {
                        return {
                            label: it.columnDef.meta?.title || it.id,
                            value: it.id
                        }
                    })}
            defaultValue={visibleColumns}
            onValueChange={setVisibleColumns}
        >
            <Button
                variant="outline"
                size="sm"
            >
                <Settings2/>
                Вид
            </Button>
        </MultiSelect>
    )
}
