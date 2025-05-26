import {ColumnDef, RowData} from "@tanstack/table-core";
import {ColumnMeta} from "@tanstack/react-table";

export const customSortingFn = (rowA, rowB, columnId) => {
    const getValue = (row) => {
        const value = row.getValue(columnId);
        if (value === undefined || value === null) return "";
        return String(value);
    };

    const a = getValue(rowA);
    const b = getValue(rowB);

    if (a === b) return 0;
    if (a === "+" || a === "-") return 1;
    if (b === "+" || b === "-") return -1;

    return a.localeCompare(b, "ru", {numeric: true});
};

export type ColumnType = 'string' | 'number' | 'list' | 'boolean' | 'datetime' | 'none'
export type TypedColumnDef<T extends RowData> = ColumnDef<T> & { meta: ColumnMeta<T, unknown> & { type: ColumnType, selectFromFile?: true } }
