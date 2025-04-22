import RichTableView from "@/components/app/table/RichTableView.tsx";
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {ApiUserInfoRoomModel} from "@/store/global-store.ts";
import {columnsUserInfoRoom} from "@/store/columnsUserInfoRoom.tsx";

function UserInfoRoomTableView(props: {
    data: ApiUserInfoRoomModel[]
}) {
    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsUserInfoRoom,
                }}
                contextMenuConfig={{
                    getLabel: (rows) =>
                        rows.length === 1 ? rows[0].getValue("username") : `Выбрано: ${rows.length}`,
                    items: (rows) => (
                        <>
                            <ContextMenuItem>Удалить комнату</ContextMenuItem>
                            <ContextMenuItem>Скрыть комнату</ContextMenuItem>
                            <ContextMenuItem>Добавить участников</ContextMenuItem>
                            <ContextMenuItem>Удалить участников</ContextMenuItem>
                            <ContextMenuItem>Добавить команды</ContextMenuItem>
                            <ContextMenuItem>Удалить команды</ContextMenuItem>
                            {rows.length === 1 && <ContextMenuItem>Управление</ContextMenuItem>}
                        </>
                    )
                }}
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true

                    //rowClickHandler: (user) => openModal(user)
                }}
            />
        </>
    )
}

export default UserInfoRoomTableView