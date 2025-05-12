// src/components/multi-select.tsx

import * as React from "react";
import {
    CheckIcon, ChevronDown,
    XIcon,
} from "lucide-react";

import {cn} from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {Slot} from "@radix-ui/react-slot";
import {Button} from "@/components/ui/button.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {Separator} from "@/components/ui/separator.tsx";

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * An array of option objects to be displayed in the multi-select component.
     * Each option object has a label, value, and an optional icon.
     */
    options: {
        /** The text to display for the option. */
        label: string;
        /** The unique value associated with the option. */
        value: string;
        /** Optional icon component to display alongside the option. */
        icon?: React.ComponentType<{ className?: string }>;
    }[];
    /**
     * Callback function triggered when the selected values change.
     * Receives an array of the new selected values.
     */
    onValueChange: (value: string[]) => void;
    /** Custom trigger button (optional) */
    trigger?: React.ReactNode;
    /** The default selected values when the component mounts. */
    defaultValue?: string[];
    /**
     * Placeholder text to be displayed when no values are selected.
     * Optional, defaults to "Select options".
     */
    placeholder?: string;

    /**
     * Maximum number of items to display. Extra selected items will be summarized.
     * Optional, defaults to 3.
     */
    maxCount?: number;
    /**
     * The modality of the popover. When set to true, interaction with outside elements
     * will be disabled and only popover content will be visible to screen readers.
     * Optional, defaults to false.
     */
    modalPopover?: boolean;

    /**
     * Additional class names to apply custom styles to the multi-select component.
     * Optional, can be used to add custom styles.
     */
    className?: string;

    asChild?: boolean;
}

export const MultiSelect = React.forwardRef<
    HTMLButtonElement,
    MultiSelectProps
>(
    (
        {
            options,
            onValueChange,
            defaultValue = [],
            modalPopover = false,
            className,
            asChild,
            placeholder = 'Выберите',
            ...props
        },
        ref
    ) => {
        const [selectedValues, setSelectedValues] =
            React.useState<string[]>(defaultValue);
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

        const handleInputKeyDown = (
            event: React.KeyboardEvent<HTMLInputElement>
        ) => {
            if (event.key === "Enter") {
                setIsPopoverOpen(true);
            } else if (event.key === "Backspace" && !event.currentTarget.value) {
                const newSelectedValues = [...selectedValues];
                newSelectedValues.pop();
                setSelectedValues(newSelectedValues);
                onValueChange(newSelectedValues);
            }
        };
        const toggleOption = (option: string) => {
            const newSelectedValues = selectedValues.includes(option)
                ? selectedValues.filter((value) => value !== option)
                : [...selectedValues, option];
            setSelectedValues(newSelectedValues);
            onValueChange(newSelectedValues);
        };

        const handleClear = () => {
            setSelectedValues([]);
            onValueChange([]);
        };

        const handleTogglePopover = (e?: React.MouseEvent) => {
            e?.stopPropagation();
            setIsPopoverOpen((prev) => !prev);
        };
        React.useEffect(() => {
            if (isPopoverOpen) {
                const input = document.querySelector('.multi-select-search-input');
                if (input) {
                    (input as HTMLInputElement).focus();
                }
            }
        }, [isPopoverOpen]);
        return (
            <Popover
                open={isPopoverOpen}
                onOpenChange={setIsPopoverOpen}
            >
                <PopoverTrigger asChild>
                    {
                        asChild ? (
                            <Slot
                                onClick={handleTogglePopover}
                                className={cn(className)}
                                ref={ref}
                                {...props}
                            />
                        ) : (
                            <Button
                                ref={ref}
                                {...props}
                                onClick={handleTogglePopover}
                                className={cn(
                                    "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
                                    className
                                )}
                            >
                                {selectedValues.length > 0 ? (
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex flex-wrap items-center gap-1">
                                            {selectedValues.map((value) => {
                                                const option = options.find((o) => o.value === value);
                                                const IconComponent = option?.icon;
                                                return (
                                                    <Badge
                                                        key={value}
                                                        className={"rounded-md"}
                                                        variant={"outline"}
                                                    >
                                                        {IconComponent && (
                                                            <IconComponent className="h-4 w-4 mr-2"/>
                                                        )}
                                                        {option?.label}
                                                        <XIcon
                                                            className="ml-1 !size-3 cursor-pointer text-muted-foreground hover:text-foreground"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                toggleOption(value);
                                                            }}
                                                        />
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <XIcon
                                                className="!size-4 mx-2 cursor-pointer text-muted-foreground hover:text-foreground"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleClear();
                                                }}
                                            />
                                            <Separator
                                                orientation="vertical"
                                                className="flex min-h-6 h-full"
                                            />
                                            <ChevronDown className="!size-4 mx-2 cursor-pointer text-muted-foreground hover:text-foreground"/>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between w-full mx-auto">
                <span className="text-sm text-muted-foreground mx-3">
                  {placeholder}
                </span>
                                        <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2"/>
                                    </div>
                                )}
                            </Button>
                        )}
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 z-[100]"
                    align="start"
                    onEscapeKeyDown={(e) => {
                        setIsPopoverOpen(false);
                        e.preventDefault();
                    }}
                    onPointerDownOutside={(e) => {
                        const target = e.target as HTMLElement;
                        // Разрешаем закрытие только кликами вне триггера
                        if (!target.closest('.multi-select-trigger')) {
                            setIsPopoverOpen(false);
                        }
                        e.preventDefault();
                    }}
                    usePortal={false}
                >
                    <Command>
                        <CommandInput
                            placeholder="Поиск..."
                            onKeyDown={handleInputKeyDown}
                            autoFocus
                            className="multi-select-search-input"
                        />
                        <CommandList>
                            <CommandEmpty>Нет результатов.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => {
                                    const isSelected = selectedValues.includes(option.value);
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => toggleOption(option.value)}
                                            className="cursor-pointer"
                                        >
                                            <div
                                                className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground"
                                                        : "opacity-50 [&_svg]:invisible"
                                                )}
                                            >
                                                <CheckIcon className="h-4 w-4"/>
                                            </div>
                                            {option.icon && (
                                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground"/>
                                            )}
                                            <span>{option.label}</span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                            <CommandSeparator/>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }
)
