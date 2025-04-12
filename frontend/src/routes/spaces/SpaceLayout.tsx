import {Outlet, useParams} from "react-router";
import {useEffect} from "react";
import {useSetAtom} from "jotai/react";
import {useAtomValue} from "jotai";
import {$selectedSpace, $selectedSpaceId, $spaces} from "@/store/global-store.ts";
import {BatchLoader} from "@/components/reusableComponents/DataLoader.tsx";
import {loaded} from "@/api";

function SpaceLayout() {
    const spaceId = useParams()['spaceId']
    const setSelectedSpaceId = useSetAtom($selectedSpaceId)
    const selectedSpace = useAtomValue($selectedSpace)
    const spaces = useAtomValue($spaces)

    useEffect(() => {
        setSelectedSpaceId(spaceId!)
    }, [setSelectedSpaceId, spaceId]);

    return (
        <>
            <BatchLoader
                states={[spaces, selectedSpace]}
                loadingMessage={"Загрузка пространства"}
                display={() =>
                    <Outlet context={{
                        selectedSpace: loaded(selectedSpace).data,
                        spaces: loaded(spaces).data
                    }}/>
                }
            />
        </>
    )
}

export default SpaceLayout
