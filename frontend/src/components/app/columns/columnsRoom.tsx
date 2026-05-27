import DataTableColumnHeader from "@/components/app/table/DataTableColumnHeader.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {ApiRoomModel, $selectedSpaceId} from "@/store/global-store.ts";
import {CheckboxRenderer, MonoRenderer, OptRenderer} from "@/components/app/ValueRenderers.tsx";
import {customSortingFn, TypedColumnDef} from "@/lib/table.ts";
import { useAtomValue } from "jotai";
import { NavLink } from "react-router";

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
                className="row-select-checkbox"
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
        header: DataTableColumnHeader,
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
        header: DataTableColumnHeader,
        meta: {
            title: "Описание",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "broadcast",
        header: DataTableColumnHeader,
        meta: {
            title: "Бродкаст",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "name",
        header: DataTableColumnHeader,
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
        header: DataTableColumnHeader,
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
        header: DataTableColumnHeader,
        meta: {
            title: "Сообщения",
            type: 'number'
        },
    },
    {
        accessorKey: "usersCount",
        header: DataTableColumnHeader,
        meta: {
            title: "Пользователи",
            type: 'number'
        },
    },
    {
        accessorKey: "u._id",
        header: DataTableColumnHeader,
        meta: {
            title: "Создатель",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({row}) => {
            const spaceId = useAtomValue($selectedSpaceId);
            const creatorId = row.original.u?._id;
            const creatorFio = row.original.u?.name ?? row.original.u?.username ?? creatorId;

            if (!spaceId || !creatorId) return <span>-</span>;

            return (
            <NavLink
                to={`/spaces/${spaceId}/dashboard/users/${creatorId}`}
                className="text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
            >
                {creatorFio}
            </NavLink>
            );
        },
    },
    {
        accessorKey: "ro",
        header: DataTableColumnHeader,
        meta: {
            title: "Read only",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "default",
        header: DataTableColumnHeader,
        meta: {
            title: "Default",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "topic",
        header: DataTableColumnHeader,
        meta: {
            title: "Тема",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "announcement",
        header: DataTableColumnHeader,
        meta: {
            title: "Объявление",
            type: 'string'
        },
        sortingFn: customSortingFn,
        cell: ({cell}) => <OptRenderer value={cell.getValue()} />
    },
    {
        accessorKey: "archived",
        header: DataTableColumnHeader,
        meta: {
            title: "Архив",
            type: 'boolean'
        },
        cell: ({cell}) => <CheckboxRenderer value={cell.getValue()} />
    },
] as TypedColumnDef<ApiRoomModel>[]
