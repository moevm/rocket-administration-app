import {atom} from "jotai";
import {$api, loadableQuery} from "@/api";
import {atomWithQuery} from 'jotai-tanstack-query'
import {loadable} from "jotai/utils";
import {components} from "@/schema";
import {Atom} from "jotai/vanilla";
import {Loadable} from "jotai/vanilla/utils/loadable";

export type ApiSpaceModel = components['schemas']['SpaceDto']

export const $spacesQuery = atomWithQuery(() => $api.queryOptions('get', '/spaces'))
export const $spaces: Atom<Loadable<Promise<ApiSpaceModel[]>>> = loadableQuery($spacesQuery)

export const $selectedSpaceId = atom<string | null>(null)

export const $selectedSpace: Atom<Loadable<Promise<ApiSpaceModel>>> = loadable(atom(async (get) => {
    const spaces = await get($spacesQuery).promise
    const selectedSpaceId = get($selectedSpaceId)
    const result = spaces.find(it => it._id === selectedSpaceId)

    if (!result) {
        throw Error('Space not found: ' + selectedSpaceId)
    }

    return result
}))

