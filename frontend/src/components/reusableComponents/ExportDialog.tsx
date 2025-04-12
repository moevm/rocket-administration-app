import { MultiSelect } from "@/components/ui/multi-select";
import { Table } from "@tanstack/react-table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {useEffect, useState} from "react";
import {DialogBase} from "@/components/ui/DialogBase.tsx";
import {Button} from "@/components/ui/button.tsx";

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: Table<any>;
    selectedCount: number;
    onExport: (format: string, selectedFields: string[]) => void;
}

export const ExportDialog = ({
                                 open,
                                 onOpenChange,
                                 table,
                                 selectedCount,
                                 onExport,
                             }: ExportDialogProps) => {
    const [format, setFormat] = useState("CSV");
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    const handleExport = () => {
        onExport(format, selectedFields);
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
                                <RadioGroupItem value={value} id={value} />
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
