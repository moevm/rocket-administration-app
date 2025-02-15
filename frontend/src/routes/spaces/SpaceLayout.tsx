import {Outlet, useParams} from "react-router";
import {useEffect} from "react";
import {useSetAtom} from "jotai/react";
import {$selectedSpaceId} from "@/routes/global-store.ts";


function SpaceLayout() {
    const spaceId = useParams()['spaceId']
    const setSelectedSpaceId = useSetAtom($selectedSpaceId)

    useEffect(() => {
        // TODO validation
        setSelectedSpaceId(Number(spaceId))
    }, [spaceId]);

    return (
        <Outlet />
    )
}

export default SpaceLayout