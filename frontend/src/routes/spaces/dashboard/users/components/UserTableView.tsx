import RichTableView from "@/components/app/table/RichTableView.tsx";
import {columnsUser} from "@/store/columnsUser.tsx";
import {useNavigate} from "react-router";
import {$selectedSpaceId, ApiUserModel} from "@/store/global-store.ts";
import {useAtomValue} from "jotai/index";
import {userContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";


function UserTableView(props: {
    data: ApiUserModel[]
}) {
    const navigate = useNavigate();
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsUser
                }}
                contextMenuConfig={
                    userContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true,
                    // rowClickHandler: (user) => navigate(`/spaces/${selectedSpaceId}/dashboard/users/${user._id}`)
                }}
            />
        </>
    )
}

export default UserTableView
