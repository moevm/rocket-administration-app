import {Label} from "@/components/ui/label.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {MultiSelect} from "@/components/ui/multi-select.tsx";
import * as React from "react";
import {useState} from "react";
import {exportData, Format, writeData} from "@/lib/importExport.ts";
import {Table} from "@tanstack/react-table";
import {Button} from "@/components/ui/button.tsx";

interface ExportCardProps<TData extends object> {
    table?: Table<any>;
    // onExport: (format: string, selectedFields: string[]) => void;
    data: TData[];
}

function ExportCard<TData extends object>(
    {
        table,
        // onExport: (format: string, selectedFields: string[]) => void;
        data
    } : ExportCardProps<TData>
) {

    const [format, setFormat] = useState<Format>("CSV");
    const [selectedFields, setSelectedFields] = useState<string[] | null>(table ? [] : null);

    const handleExport = () => {
        // onExport(format, selectedFields);
        console.log("format: ", format, "\nfiles: ", selectedFields, "\ndata: ", data, JSON.stringify(data));

        const exportFile = writeData(format, data, selectedFields);
        exportData(format, exportFile);

        setSelectedFields(null);
    };

    const enabled = data.length > 0 && (selectedFields === null || selectedFields.length > 0)

    return (
        <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col items-start gap-2 w-full">
                <Label>Формат</Label>
                <RadioGroup
                    value={format}
                    onValueChange={setFormat}
                    className="grid grid-cols-3 gap-2"
                >
                    {["CSV", "JSON", "XLSX"].map((value) => (
                        <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={value}/>
                            <Label htmlFor={value}>{value}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            {table ? (
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
            ) : (
                <></>
            )
            }

            <Button
                type="submit"
                className="w-full"
                onClick={handleExport}
                disabled={!enabled}
            >
                Экспорт
            </Button>
        </div>
    )
}

export default ExportCard