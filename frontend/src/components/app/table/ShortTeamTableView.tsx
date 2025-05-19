import RichTableView from "@/components/app/table/RichTableView.tsx";
import {$selectedSpaceId, ApiShortTeamModel} from "@/store/global-store.ts";
import {columnsShortTeam} from "@/components/app/columns/columnsShortTeam.tsx";
import {useNavigate} from "react-router";
import {teamContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai";

function ShortTeamTableView(props: {
    data: ApiShortTeamModel[]
}) {
    const navigate = useNavigate()
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                tableId={'short-team'}
                entries={props.data}
                tableConfig={{
                    columns: columnsShortTeam,
                }}
                contextMenuConfig={
                    teamContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: true,
                    enableColumnVisibilityToggle: true,
                    rowClickHandler: (team) => navigate(`/spaces/${selectedSpaceId}/dashboard/teams/${team._id}`)
                }}
            />
        </>
    )
}

export default ShortTeamTableView;
