import {useOutletContext} from "react-router";
import {ApiSpaceModel} from "@/store/spaces.ts";

function NotificationsPage() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[],
        selectedSpace: ApiSpaceModel
    }>()
    return (
        <>
            {JSON.stringify(context)} notifications
        </>
    )
}

export default NotificationsPage
