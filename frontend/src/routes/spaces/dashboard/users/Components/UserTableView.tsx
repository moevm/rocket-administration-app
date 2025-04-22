import RichTableView from "@/components/reusableComponents/RichTableView.tsx";
import {columnsUser} from "@/store/columnsUser.tsx";
import {ContextMenuItem} from "@/components/ui/context-menu.tsx";

function UserTableView (data: any) {
    console.info(data)
    return (
        <>
            <RichTableView
                dataAtom={data}
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
                    enableColumnVisibilityToggle: true

                    //rowClickHandler: (user) => openModal(user)
                }}
            />
        </>
    )
}

export default UserTableView
