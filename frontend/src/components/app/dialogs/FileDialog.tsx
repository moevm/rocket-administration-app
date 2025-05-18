import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {ReactNode, useEffect, useState} from "react";
import {toast} from "sonner";
import {detectFormatFromFileName, parseData} from "@/lib/importExport.ts";
import {DialogBase} from "@/components/app/dialogs/DialogBase.tsx";
import {errorMessage} from "@/api";
import {Loader2} from "lucide-react";

interface FileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    buttonText: string;
    description?: string;
    onSubmit: (data: object[]) => boolean;
    content?: ReactNode,
    loading?: boolean
    buttonDisabled?: boolean
}

const allowedTypes = [
    "text/csv",
    "application/json",
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];

export const FileDialog = ({
                               open,
                               onOpenChange,
                               title,
                               buttonText,
                               onSubmit,
                               description,
                               content,
    loading = false,
    buttonDisabled = false,
                           }: FileDialogProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setSelectedFile(null);
            setError(null);
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            setSelectedFile(null);
            toast.error("Неверный формат файла. Допустимы: CSV, JSON, XLS, XLSX.");
        } else {
            setSelectedFile(file);
            setError(null);
        }
    };

    // const handleSubmit = () => {
    //     if (selectedFile) {
    //         onSubmit(selectedFile);
    //         setSelectedFile(null);
    //         onOpenChange(false);
    //     }
    // };

    // TODO: ПОКА ЧТО СТАБИЛЕН ТОЛЬКО JSON ДЛЯ ИМПОРТА
    const handleSubmit = async () => {
        if (!selectedFile) return;

        const format = detectFormatFromFileName(selectedFile.name);
        if (!format) {
            toast.error("Неподдерживаемый формат файла");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result;
            try {
                let parsedData: object[] = [];

                parsedData = parseData(format, result as string);

                const submitResult = onSubmit(parsedData)

                if (submitResult) {
                    onOpenChange(false);
                    setSelectedFile(null);
                }
            } catch (e) {
                console.error(e)
                toast.error("Ошибка при чтении файла: " + errorMessage(e));
            }
        };

        reader.readAsText(selectedFile);
    };

    useEffect(() => {
        if (open) {
            setSelectedFile(null);
            setError(null);
        }
    }, [open]);

    const Description = (<>
            CSV, JSON, XLS
            {description && (<>
                <br/>
                {description}
            </>)}
        </>
    )

    return (
        <DialogBase
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={Description}
            contentClassName="w-[400px]"
            footerContent={
                <Button
                    type="submit"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!selectedFile || !!error || loading || buttonDisabled}
                >
                    {loading
                        ? <>
                            <Loader2 className="animate-spin"/>
                            Загрузка</>
                        : <>
                        {buttonText}
                        </>
                    }
                </Button>
            }
        >
            <div className="flex items-center justify-center w-full">
                <Input
                    type="file"
                    className="w-full"
                    onChange={handleFileChange}
                    accept=".csv,.json,.xls,.xlsx"
                />
            </div>
            {content}
        </DialogBase>
    );
};
