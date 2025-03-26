import {Outlet, useParams} from "react-router";
import {useEffect} from "react";
import {useSetAtom} from "jotai/react";
import {$selectedSpace, $selectedSpaceId} from "@/store/spaces";
import {useAtomValue} from "jotai";
import {$spaces} from "@/store/spaces.ts";

function SpaceLayout() {
    const spaceId = useParams()['spaceId']
    const setSelectedSpaceId = useSetAtom($selectedSpaceId)
    const selectedSpace = useAtomValue($selectedSpace)
    const spaces = useAtomValue($spaces)

    useEffect(() => {
        setSelectedSpaceId(spaceId!)
    }, [setSelectedSpaceId, spaceId]);

    return (
        // TODO custom component
        <>
            {selectedSpace.state === 'hasError' && <div>{String(selectedSpace.error)}</div>}
            {selectedSpace.state === 'loading' && <div>Loading...</div>}
            {selectedSpace.state === 'hasData' && <Outlet context={{
                selectedSpace: selectedSpace.data,
                spaces: spaces.data
            }} />}
        </>
    )
}

export default SpaceLayout
