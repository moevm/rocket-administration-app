import RichTableView from "@/components/app/table/RichTableView.tsx";
import {$selectedSpaceId, ApiRoomUserModel} from "@/store/global-store.ts";
import {useNavigate} from "react-router";
import {roomContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai";
import {Row} from "@tanstack/table-core/src/types.ts";
import {columnsUsersSmall} from "@/components/app/columns/columnsUsersSmall.tsx";

function UserSmallTableView(props: {
    data: ApiRoomUserModel[],
    onSelectionUpdated?: (data: Row<ApiRoomUserModel>[]) => void
}) {
    const navigate = useNavigate()
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                tableId={'user-small'}
                entries={props.data}
                tableConfig={{
                    columns: columnsUsersSmall,
                }}
                contextMenuConfig={
                    roomContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true,
                }}
                onSelectionUpdated={(data) => {
                    props.onSelectionUpdated?.(data)
                }}
            />
        </>
    )
}

export default UserSmallTableView
