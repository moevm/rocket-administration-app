import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Dayjs} from "dayjs";

function MissingValue() {
    return <span className={"text-foreground/70"}>–</span>
}

export function CheckboxRenderer({value}: {
    value: boolean | undefined | null
}) {
    return <>{
        (typeof value === 'boolean')
            ? <Checkbox checked={value}/>
            : <MissingValue/>
    }</>
}

export function MonoRenderer({value}: {
    value: string | undefined | null
}) {
    return (
        <span className="font-mono text-xs">{(value !== null && value !== undefined) ? String(value) : <MissingValue/>}</span>
    )
}

export function OptRenderer({value}: {
    value: string | undefined | null
}) {
    return (
        <span>{(value !== null && value !== undefined) ? String(value) : <MissingValue/>}</span>
    )
}

export function ListRenderer({value}: {
    value: string[] | undefined | null
}) {
    return (
        <span>{value?.join(', ') ?? <MissingValue/>}</span>
    )
}

export function DateRenderer({ value }: { value: Dayjs | null | undefined }) {
    if (!value || !value.isValid()) {
        return <MissingValue />;
    }

    return <span>{value.format('DD.MM.YYYY HH:mm')}</span>;
}
