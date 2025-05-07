import RichTableView from "@/components/app/table/RichTableView.tsx";
import {columnsTeam} from "@/store/columnsTeam.tsx";
import {$selectedSpaceId, ApiTeamModel} from "@/store/global-store.ts";
import {useNavigate} from "react-router";
import {teamContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai/index";

function TeamsTableView(props: {
    data: ApiTeamModel[]
}) {
    const navigate = useNavigate();
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    return (
        <>
            <RichTableView
                entries={props.data}
                tableConfig={{
                    columns: columnsTeam
                }}
                contextMenuConfig={
                    teamContextMenuConfig
                }
                settings={{
                    enableSearch: true,
                    enableExport: false,
                    enableColumnVisibilityToggle: true,
                    rowClickHandler: (team) => navigate(`/spaces/${selectedSpaceId}/dashboard/teams/${team._id}`)
                }}
            />
        </>
    )
}

export default TeamsTableView
