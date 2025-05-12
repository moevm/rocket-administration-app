import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiRoomModel} from "@/store/global-store.ts";
import {TypedColumnDef} from "@/store/columnsUser.tsx";
import {CheckboxRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";


//TODO: вынести в отдельный компонент
const customSortingFn = (rowA, rowB, columnId) => {
    const getValue = (row) => {
        const value = row.getValue(columnId);
        if (value === undefined || value === null) return "";
        return String(value);
    };

    const a = getValue(rowA);
    const b = getValue(rowB);

    if (a === b) return 0;
    if (a === "+" || a === "-") return 1;
    if (b === "+" || b === "-") return -1;

    return a.localeCompare(b, "ru", {numeric: true});
};

const typesName = {
    d: "Личные сообщения",
    c: "Публичный канал",
    p: "Приватный канал",
    l: "Лайвчат",
    v: "Omnichannel VoIP rooms"
}

export const columnsRoom = [
    {
        id: "select",
        header: ({table}) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Выбрать всё"
            />
        ),
        cell: ({row}) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Выбрать"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: {
            type: 'none'
        }
    },
    {
        accessorKey: "_id",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="id"/>
            )
        },
        meta: {
            title: "id",
            type: 'string',
            selectFromFile: true,
        },
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />,
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "description",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Описание"/>
            )
        },
        meta: {
            title: "Описание",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "broadcast",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Бродкаст"/>
            )
        },
        meta: {
            title: "Бродкаст",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "name",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Имя"/>
            )
        },
        meta: {
            title: "Имя",
            type: 'string',
            selectFromFile: true,
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        id: "t",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Тип"/>
            )
        },
        accessorFn: (row) => {
            return typesName[row.t] ?? row.t
        },
        meta: {
            title: "Tип",
            type: 'string'
        },
        sortingFn: customSortingFn,
    },
    {
        accessorKey: "msgs",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Сообщения"/>
            )
        },
        meta: {
            title: "Сообщения",
            type: 'number'
        },
    },
    {
        accessorKey: "usersCount",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Пользователи"/>
            )
        },
        meta: {
            title: "Пользователи",
            type: 'number'
        },
    },
    {
        accessorKey: "u._id",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Администратор"/>
            )
        },
        meta: {
            title: "Администратор",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <MonoRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "ro",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Read only"/>
            )
        },
        meta: {
            title: "Read only",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "default",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Default"/>
            )
        },
        meta: {
            title: "Default",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "topic",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Тема"/>
            )
        },
        meta: {
            title: "Тема",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "announcement",
        header: ({column}) => {
            return (
                <DataTableColumnHeader column={column} title="Объявление"/>
            )
        },
        meta: {
            title: "Объявление",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
] as TypedColumnDef<ApiRoomModel>[]
