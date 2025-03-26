import {Outlet, useParams} from "react-router";
import {useEffect} from "react";
import {useSetAtom} from "jotai/react";
import {useAtomValue} from "jotai";
import {$selectedSpace, $selectedSpaceId, $spaces} from "@/store/global-store.ts";
import DataLoader from "@/components/reusableComponents/DataLoader.tsx";

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
            <DataLoader
                state={selectedSpace}
                loadingMessage={"Загрузка пространства"}
                display={(data) =>
                    <Outlet context={{
                        selectedSpace: data,
                        spaces: spaces.data
                    }}/>
                }
            />
        </>
    )
}

export default SpaceLayout
