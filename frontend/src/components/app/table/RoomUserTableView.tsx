import RichTableView from "@/components/app/table/RichTableView.tsx";
import {$selectedSpaceId, ApiRoomUserModel} from "@/store/global-store.ts";
import {useNavigate} from "react-router";
import {columnsRoomUser} from "@/store/columnsRoomUser.tsx";
import {userContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai";


function RoomUserTableView(props: {
    data: ApiRoomUserModel[]
}) {
    const navigate = useNavigate();
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsRoomUser
                }}
                contextMenuConfig={
                    userContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true,
                    rowClickHandler: (user) => navigate(`/spaces/${selectedSpaceId}/dashboard/users/${user._id}`)
                }}
            />
        </>
    )
}

export default RoomUserTableView
