import RichTableView from "@/components/app/table/RichTableView.tsx";
import {columnsTeam} from "@/components/app/columns/columnsTeam.tsx";
import {$selectedSpaceId, ApiTeamModel, showAddNewTeamDialogAtom} from "@/store/global-store.ts";
import {useNavigate} from "react-router";
import {teamContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {useAtomValue} from "jotai/index";
import {Button} from "@/components/ui/button.tsx";
import {useSetAtom} from "jotai/react";

function TeamsTableView(props: {
    data: ApiTeamModel[]
}) {
    const navigate = useNavigate();
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const setAddNewTeamDialogOpen = useSetAtom(showAddNewTeamDialogAtom)


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
                buttonsSlot={() => (
                    <Button variant="outline" size="sm" onClick={() => {setAddNewTeamDialogOpen(true)}}>
                        Создать команду
                    </Button>
                )}
            />
        </>
    )
}

export default TeamsTableView
