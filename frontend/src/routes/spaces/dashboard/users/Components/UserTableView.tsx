import RichTableView from "@/components/app/table/RichTableView.tsx";
import {columnsUser} from "@/store/columnsUser.tsx";
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";
import {useNavigate} from "react-router";
import {ApiUserModel} from "@/store/global-store.ts";


function UserTableView (props: {
    data: ApiUserModel[]
}) {
    const navigate = useNavigate();

    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsUser
                }}
                contextMenuConfig={{
                    getLabel: (rows) =>
                        rows.length === 1 ? rows[0].getValue("username") : `Выбрано: ${rows.length}`,
                    items: (rows) => (
                        <>
                            <ContextMenuItem>Добавить в команду</ContextMenuItem>
                            <ContextMenuItem>Добавить в комнату</ContextMenuItem>
                            <ContextMenuItem>Удалить из команды</ContextMenuItem>
                            <ContextMenuItem>Удалить из комнаты</ContextMenuItem>
                            <ContextMenuItem>Сменить пароль</ContextMenuItem>
                            <ContextMenuItem>Удалить</ContextMenuItem>
                            {rows.length === 1 && <ContextMenuItem>Управление</ContextMenuItem>}
                        </>
                    )
                }}
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true,
                    rowClickHandler: (user) => navigate(user._id)
                }}
            />
        </>
    )
}

export default UserTableView
