import RichTableView from "@/components/app/table/RichTableView.tsx";
import {columnsUser} from "@/components/app/columns/columnsUser.tsx";
import {useNavigate} from "react-router";
import {
    $selectedSpaceId,
    ApiUserModel,
    showAddNewUserDialogAtom
} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {userContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";


function UserTableView(props: {
    data: ApiUserModel[]
}) {
    const navigate = useNavigate();
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const setAddNewUserDialogOpen = useSetAtom(showAddNewUserDialogAtom)

    return (
        <>
            <RichTableView
                tableId={'user'}
                entries={props.data}
                tableConfig={{
                    columns: columnsUser,
                }}
                contextMenuConfig={
                    userContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableImport: true,
                    // enableSelectFromFile: true,
                    enableColumnVisibilityToggle: true,
                    rowClickHandler: (user) => navigate(`/spaces/${selectedSpaceId}/dashboard/users/${user._id}`)
                }}
                buttonsSlot={() => (
                    <Button variant="outline" size="sm" onClick={() => {setAddNewUserDialogOpen(true)}}>
                        Создать пользователя
                    </Button>
                )}
            />
        </>
    )
}

export default UserTableView
