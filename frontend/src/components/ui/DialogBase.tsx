import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ReactNode } from "react";
import {cn} from "@/lib/utils.ts";

interface DialogBaseProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    footerContent?: ReactNode;
    className?: string;
    contentClassName?: string;
}

export const DialogBase = ({
                               open,
                               onOpenChange,
                               title,
                               description,
                               children,
                               footerContent,
                               className,
                               contentClassName,
                           }: DialogBaseProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn("w-[600px]", contentClassName)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className={cn("flex flex-col gap-4", className)}>
                    {children}
                </div>

                {footerContent && (
                    <DialogFooter className="mt-4">
                        {footerContent}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};