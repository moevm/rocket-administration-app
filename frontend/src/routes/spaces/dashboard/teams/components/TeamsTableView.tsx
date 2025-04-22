import RichTableView from "@/components/app/table/RichTableView.tsx";
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {columnsTeam} from "@/store/columnsTeam.tsx";
import {ApiTeamModel} from "@/store/global-store.ts";

function TeamsTableView (props: {
    data: ApiTeamModel[]
}) {
    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsTeam
                }}
                contextMenuConfig={{
                    getLabel: (rows) =>
                        rows.length === 1 ? rows[0].getValue("username") : `Выбрано: ${rows.length}`,
                    items: (rows) => (
                        <>
                            <ContextMenuItem>Удалить команды</ContextMenuItem>
                            <ContextMenuItem>Добавить участников</ContextMenuItem>
                            <ContextMenuItem>Удалить участников</ContextMenuItem>
                            <ContextMenuItem>Добавить в комнату</ContextMenuItem>
                            <ContextMenuItem>Удалить из комнаты</ContextMenuItem>
                            {rows.length === 1 && <ContextMenuItem>Управление</ContextMenuItem>}
                        </>
                    )
                }}
                settings={{
                    enableSearch: true,
                    enableExport: false,
                    enableColumnVisibilityToggle: true

                    //rowClickHandler: (user) => openModal(user)
                }}
            />
        </>
    )
}

export default TeamsTableView
