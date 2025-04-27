import RichTableView from "@/components/app/table/RichTableView.tsx";
import {$selectedSpaceId, ApiUserInfoRoomModel} from "@/store/global-store.ts";
import {columnsUserInfoRoom} from "@/store/columnsUserInfoRoom.tsx";
import {useNavigate} from "react-router";
import {roomContextMenuConfig} from "@/components/app/table/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai";

function UserInfoRoomTableView(props: {
    data: ApiUserInfoRoomModel[]
}) {
    const navigate = useNavigate()
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsUserInfoRoom,
                }}
                contextMenuConfig={
                    roomContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true,
                    rowClickHandler: (room) => navigate(`/spaces/${selectedSpaceId}/dashboard/rooms/${room.rid}`)
                }}
            />
        </>
    )
}

export default UserInfoRoomTableView