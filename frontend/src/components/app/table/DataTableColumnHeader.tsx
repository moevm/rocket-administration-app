import {Column} from "@tanstack/react-table"
import {ArrowDown, ArrowUp, ChevronsUpDown, EyeOff} from "lucide-react"

import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {useMemo} from "react";

interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>
    title: string,
    hide: () => void
}

function DataTableColumnHeader<TData, TValue>({
                                                  column,
                                                  className,
                                              }: DataTableColumnHeaderProps<TData, TValue>) {
    const title = useMemo(() => column.columnDef.meta?.title ?? column.id, [column])

    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>
    }

    return (
        <div className={cn("flex items-center space-x-2", className)}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                    >
                        <span>{title}</span>
                        {column.getIsSorted() === "desc" ? (
                            <ArrowDown/>
                        ) : column.getIsSorted() === "asc" ? (
                            <ArrowUp/>
                        ) : (
                            <ChevronsUpDown/>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                        <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70"/>
                        По возрастанию
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                        <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70"/>
                        По убыванию
                    </DropdownMenuItem>
                    {/*<DropdownMenuSeparator/>*/}
                    {/*<DropdownMenuItem onClick={() => hide()}>*/}
                    {/*    <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70"/>*/}
                    {/*    Спрятать*/}
                    {/*</DropdownMenuItem>*/}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default DataTableColumnHeader
