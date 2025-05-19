import RichTableView from "@/components/app/table/RichTableView.tsx";
import {$selectedSpaceId, ApiShortTeamModel} from "@/store/global-store.ts";
import {columnsShortTeam} from "@/components/app/columns/columnsShortTeam.tsx";
import {useNavigate} from "react-router";
import {teamContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai";
import {Row} from "@tanstack/table-core/src/types.ts";
import {RoomSmallTableViewTData} from "@/components/app/table/RoomSmallTableView.tsx";
import {columnsTeamSmall} from "@/components/app/columns/columnsTeamSmall.tsx";

function TeamSmallTableView(props: {
    data: ApiShortTeamModel[],
    onSelectionUpdated?: (data: Row<ApiShortTeamModel>[]) => void
}) {
    const navigate = useNavigate()
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                tableId={'small-team'}
                entries={props.data}
                tableConfig={{
                    columns: columnsTeamSmall,
                }}
                contextMenuConfig={
                    teamContextMenuConfig
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

export default TeamSmallTableView;
