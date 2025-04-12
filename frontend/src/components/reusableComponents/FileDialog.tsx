
import { Input } from "@/components/ui/input";
import {DialogBase} from "@/components/ui/DialogBase.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useEffect, useState} from "react";
import {toast} from "sonner";

interface FileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    buttonText: string;
    onSubmit: (selectedFile: File) => void;
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

    const handleSubmit = () => {
        if (selectedFile) {
            onSubmit(selectedFile);
            setSelectedFile(null);
            onOpenChange(false);
        }
    };

    useEffect(() => {
        if (open) {
            setSelectedFile(null);
            setError(null);
        }
    }, [open]);


    return (
        <DialogBase
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={"CSV, JSON, XLS"}
            contentClassName="w-[400px]"
            footerContent={
                <Button
                    type="submit"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!selectedFile || !!error}
                >
                    {buttonText}
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
        </DialogBase>
    );
};