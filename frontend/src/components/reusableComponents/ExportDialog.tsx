import {MultiSelect} from "@/components/ui/multi-select";
import {Table} from "@tanstack/react-table";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {useEffect, useState} from "react";
import {DialogBase} from "@/components/ui/DialogBase.tsx";
import {Button} from "@/components/ui/button.tsx";
import {exportData, Format, writeData} from "@/utils/exportFiles.ts";

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
    const [format, setFormat] = useState<Format>("CSV");
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    const handleExport = () => {
        // onExport(format, selectedFields);
        console.log("format: ", format, "\nfiles: ", selectedFields, "\ndata: ", data, JSON.stringify(data));

        // if (format === "JSON") {
        //     const filteredData = data.map(item =>
        //         selectedFields.reduce((acc, field) => {
        //             acc[field] = item[field];
        //             return acc;
        //         }, {} as Record<string, any>)
        //     );
        //
        //     const json = JSON.stringify(filteredData, null, 2);
        //     const blob = new Blob([json], { type: "application/json" });
        //     const url = URL.createObjectURL(blob);
        //
        //     const link = document.createElement("a");
        //     link.href = url;
        //     link.download = "export.json";
        //     link.click();
        //
        //     URL.revokeObjectURL(url); // очистка
        // }

        const exportFile = writeData(format, data, selectedFields);
        exportData(format, exportFile);

        setSelectedFields([]);
        onOpenChange(false);
    };

    useEffect(() => {
        if (open) {
            setSelectedFields(null);
        }
    }, [open]);

    return (
        <DialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Экспорт"
            description={`Выбрано ${selectedCount} пользователей`}
            footerContent={
                <Button
                    type="submit"
                    className="w-full"
                    onClick={handleExport}
                    disabled={(!(selectedFields?.length > 0) || !(selectedCount > 0))}
                >
                    Экспорт
                </Button>
            }
        >
            <div className="flex flex-col w-full gap-4">
                <div className="flex flex-col items-start gap-2 w-full">
                    <Label>Формат</Label>
                    <RadioGroup
                        value={format}
                        onValueChange={setFormat}
                        className="grid grid-cols-3 gap-2"
                    >
                        {["CSV", "JSON", "XLS"].map((value) => (
                            <div key={value} className="flex items-center space-x-2">
                                <RadioGroupItem value={value} id={value}/>
                                <Label htmlFor={value}>{value}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="flex flex-col items-start gap-2 w-full">
                    <Label>Поля</Label>
                    <MultiSelect
                        options={table.getAllColumns()
                            .filter(
                                column =>
                                    typeof column.accessorFn !== "undefined" &&
                                    column.getCanHide()
                                //column.columnDef.meta?.type === 'string'
                            )
                            .map(it => ({
                                label: it.columnDef.meta?.title || it.id,
                                value: it.id
                            }))}
                        onValueChange={setSelectedFields}
                        modalPopover
                        placeholder={'Выберите поля'}
                    />
                </div>
            </div>
        </DialogBase>
    );
};
