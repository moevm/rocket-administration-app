import {Label} from "@/components/ui/label.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {MultiSelect} from "@/components/ui/multi-select.tsx";
import * as React from "react";
import {useState} from "react";
import {exportData, Format, writeData} from "@/lib/importExport.ts";
import ReactTable from "@tanstack/react-table";
import {Button} from "@/components/ui/button.tsx";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ExportCardProps<TData extends object> {
    table?: ReactTable.Table<TData>;
    data: TData[];
    countedValues?: { key: keyof TData, display: string }[],
    showData?: boolean
}

function cellValue(value: any): string {
    switch (typeof value) {
        case "string":
        case "undefined":
        case "bigint":
        case "number":
        case "symbol":
            return String(value)
        default:
            return JSON.stringify(value)
    }
}

function ExportCard<TData extends object>(
    {
        table,
        data,
        countedValues,
        showData = false
    }: ExportCardProps<TData>
) {

    const [format, setFormat] = useState<Format>("CSV");
    const [selectedFields, setSelectedFields] = useState<string[] | null>(table ? [] : null);

    const handleExport = () => {
        const exportFile = writeData(format, data, selectedFields);
        exportData(format, exportFile);

        setSelectedFields(null);
    };

    const enabled = data.length > 0 && (selectedFields === null || selectedFields.length > 0)

    return (
        <div className="flex flex-col w-full gap-4">
            <div className="flex flex-col items-start gap-2 w-full">
                {
                    countedValues &&
                    (<div className={"text-sm"}>{
                        countedValues.map(value => {
                            let count = 0
                            for (const datum of data) {
                                if (datum[value.key]) {
                                    count++
                                }
                            }
                            return (<div>{value.display}: <span className={"font-bold"}>{count}/{data.length}</span></div>)
                        })
                    }</div>)
                }
                {
                    (showData && data.length !== 0) && (
                        <Table className={"overflow-auto"}>
                            <TableHeader>
                                <TableRow>
                                    {Object.keys(data[0]).map(key => <TableHead key={key}>{key}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((datum) => (
                                    <TableRow>
                                        {Object.entries(datum).map(([key, value]) => <TableCell className={"font-mono"}
                                                                                                key={key}>{cellValue(value)}</TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )
                }
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
