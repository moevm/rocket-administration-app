import RichTableView from "@/components/app/table/RichTableView.tsx";
import {ApiShortTeamModel} from "@/store/global-store.ts";
import {teamContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {Row} from "@tanstack/table-core/src/types.ts";
import {columnsTeamSmall} from "@/components/app/columns/columnsTeamSmall.tsx";

function TeamSmallTableView(props: {
    data: ApiShortTeamModel[],
    onSelectionUpdated?: (data: Row<ApiShortTeamModel>[]) => void
}) {
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
