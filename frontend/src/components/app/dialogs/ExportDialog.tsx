import {MultiSelect} from "@/components/ui/multi-select.tsx";
import {Table} from "@tanstack/react-table";
import {Label} from "@/components/ui/label.tsx";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {exportData, Format, writeData} from "@/lib/importExport.ts";
import {DialogBase} from "@/components/app/dialogs/DialogBase.tsx";
import * as React from "react";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import ExportCard from "@/components/app/dialogs/ExportCard.tsx";

interface ExportDialogProps<TData> {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: Table<any>;
    selectedCount: number;
    // onExport: (format: string, selectedFields: string[]) => void;
    data: TData[];
}

export const ExportDialog = ({
                                 open,
                                 onOpenChange,
                                 table,
                                 selectedCount, data
                                 // onExport,
                             }: ExportDialogProps<any>) => {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setSelectedFields([]);
        }
    }, [open]);

    return (
        <DialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Экспорт"
            description={`Выбрано ${selectedCount} пользователей`}
        >
            <ExportCard table={table} selectedCount={selectedCount} data={data}/>
        </DialogBase>
    );
};
