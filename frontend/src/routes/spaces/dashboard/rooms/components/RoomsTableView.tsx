import RichTableView from "@/components/app/table/RichTableView.tsx";
import {columnsRoom} from "@/components/app/columns/columnsRoom.tsx";
import {$selectedSpaceId, ApiRoomModel} from "@/store/global-store.ts";
import {useNavigate} from "react-router";
import {roomContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai";

function RoomsTableView(props: {
    data: ApiRoomModel[]
}) {
    const navigate = useNavigate();
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsRoom
                }}
                contextMenuConfig={
                    roomContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true,
                    rowClickHandler: (room) => navigate(`/spaces/${selectedSpaceId}/dashboard/rooms/${room._id}`)
                }}
            />
        </>
    )
}

export default RoomsTableView
