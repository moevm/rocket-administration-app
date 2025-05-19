import {Table} from "@tanstack/react-table";
import {useEffect, useState} from "react";
import {DialogBase} from "@/components/app/dialogs/DialogBase.tsx";
import * as React from "react";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

interface ExportDialogProps<TData> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: Table<TData>;
    selectedCount: number;
    data: TData[];
}

export function ExportDialog<TData extends object>({
                                 open,
                                 onOpenChange,
                                 table,
                                 selectedCount, data
                                 // onExport,
                             }: ExportDialogProps<TData>) {
    return (
        <DialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Экспорт"
            description={`Выбрано ${selectedCount} сущностей`}
        >
            <ExportCard table={table} data={data}/>
        </DialogBase>
    );
};
