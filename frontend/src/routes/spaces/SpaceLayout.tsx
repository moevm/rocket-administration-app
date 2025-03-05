import {Outlet, useParams} from "react-router";
import {useEffect} from "react";
import {useSetAtom} from "jotai/react";
import {$selectedSpace, $selectedSpaceId} from "@/routes/global-store.ts";
import {useAtomValue} from "jotai";
import {Toaster} from "sonner";

function SpaceLayout() {
    const spaceId = useParams()['spaceId']
    const setSelectedSpaceId = useSetAtom($selectedSpaceId)
    const selectedSpace = useAtomValue($selectedSpace)

    useEffect(() => {
        setSelectedSpaceId(spaceId!)
    }, [setSelectedSpaceId, spaceId]);


    return (
        // TODO custom component
        <>
            {selectedSpace.state === 'hasError' && <div>Error: {String(selectedSpace.error)}</div>}
            {selectedSpace.state === 'loading' && <div>Loading...</div>}
            {selectedSpace.state === 'hasData' && <Outlet/>}
        </>
    )
}

export default SpaceLayout
