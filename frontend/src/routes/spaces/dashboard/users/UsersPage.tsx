import {useOutletContext} from "react-router";
import {ApiSpaceModel} from "@/store/spaces.ts";

function UsersPage() {
    const context = useOutletContext<{
        spaces: ApiSpaceModel[],
        selectedSpace: ApiSpaceModel
    }>()
    return (
        <>
            {JSON.stringify(context)} users
        </>
    )
}

export default UsersPage
