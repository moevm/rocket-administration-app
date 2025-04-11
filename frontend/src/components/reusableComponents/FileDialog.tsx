
import { Input } from "@/components/ui/input";
import {DialogBase} from "@/components/ui/DialogBase.tsx";
import {Button} from "@/components/ui/button.tsx";

interface FileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    buttonText: string;
    onSubmit: () => void;
}

export const FileDialog = ({
                               open,
                               onOpenChange,
                               title,
                               buttonText,
                               onSubmit,
                           }: FileDialogProps) => {
    return (
        <DialogBase
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            contentClassName="w-[400px]"
            footerContent={
                <Button
                    type="submit"
                    className="w-full"
                    onClick={onSubmit}
                >
                    {buttonText}
                </Button>
            }
        >
            <div className="flex items-center justify-center w-full">
                <Input
                    type="file"
                    placeholder="Загрузить с устройства"
                    className="w-full"
                />
            </div>
        </DialogBase>
    );
};