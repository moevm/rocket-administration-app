import {CellContext, ColumnDefTemplate} from "@tanstack/table-core";
import {Checkbox} from "@/components/ui/checkbox.tsx";

function MissingValue() {
    return <span className={"text-foreground/70"}>–</span>
}

export function CheckboxRenderer<TData, TValue>(): ColumnDefTemplate<CellContext<TData, TValue>> {
    return ({cell}: CellContext<TData, TValue>) => <>{
        (typeof cell.getValue() === 'boolean')
        ? <Checkbox checked={cell.getValue()}/>
        : <MissingValue />
    }</>
}

export function MonoRenderer<TData, TValue>(): ColumnDefTemplate<CellContext<TData, TValue>> {
    return ({cell}: CellContext<TData, TValue>) => (
        <span className="font-mono text-xs">{cell.getValue() ?? <MissingValue />}</span>
    )
}

export function OptRenderer<TData, TValue>(): ColumnDefTemplate<CellContext<TData, TValue>> {
    return ({cell}: CellContext<TData, TValue>) => (
        <span>{cell.getValue() ?? <MissingValue />}</span>
    )
}

export function ListRenderer<TData, TValue>(): ColumnDefTemplate<CellContext<TData, TValue>> {
    return ({cell}: CellContext<TData, TValue>) => (
        <span>{cell.getValue()?.join(', ') ?? <MissingValue />}</span>
    )
}
