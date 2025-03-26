import {useOutletContext} from "react-router";
import {ApiSpaceModel} from "@/store/spaces.ts";

function RoomsPage() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[],
        selectedSpace: ApiSpaceModel
    }>()
    return (
        <>
            {JSON.stringify(context)} rooms
        </>
    )
}

export default RoomsPage
