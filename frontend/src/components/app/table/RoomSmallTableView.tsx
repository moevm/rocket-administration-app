import RichTableView from "@/components/app/table/RichTableView.tsx";
import {roomContextMenuConfig} from "@/components/app/ContextMenuConfigs.tsx";
import {columnsRoomSmall} from "@/components/app/columns/columnsRoomSmall.tsx";
import {Row} from "@tanstack/table-core/src/types.ts";

export interface RoomSmallTableViewTData {
    _id: string
    name: string | null | undefined
}

export default function RoomSmallTableView(props: {
    data: RoomSmallTableViewTData[],
    onSelectionUpdated?: (data: Row<RoomSmallTableViewTData>[]) => void
}) {
    return (
        <>
            <RichTableView
                tableId={'rooms-small'}
                entries={props.data}
                tableConfig={{
                    columns: columnsRoomSmall
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
