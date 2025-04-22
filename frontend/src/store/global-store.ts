import {atom} from "jotai";
import {$api, loadableQuery} from "@/api";
import {atomWithQuery} from 'jotai-tanstack-query'
import {loadable} from "jotai/utils";
import {components} from "@/schema";
import {Atom} from "jotai/vanilla";
import {Loadable} from "jotai/vanilla/utils/loadable";

export type ApiSpaceModel = components['schemas']['SpaceDto']
export type ApiUserModel = components['schemas']['UserDto']

export const $spacesQueryOptions = () => $api.queryOptions('get', '/spaces/', {})
export const $spacesQuery = atomWithQuery(() => $spacesQueryOptions())
export const $spaces: Atom<Loadable<Promise<ApiSpaceModel[]>>>  = loadableQuery($spacesQuery)

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

export const $usersQueryOptions = (spaceId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/users/`,
    {
        params: {
            path: {
                space_id: spaceId
            }
        },
    },
    {
        enabled
    }
);
export const $usersQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace)
    const enabled = selectedSpace.state === 'hasData'
    const spaceId = enabled ? selectedSpace.data._id! : ''
    return $usersQueryOptions(spaceId, enabled)
})
export const $users = loadableQuery($usersQuery)

export const $rolesQueryOptions = (spaceId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/roles/`,
    {
        params: {
            path: {
                space_id: spaceId
            }
        },
    },
    {
        enabled
    }
);
export const $rolesQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace)
    const enabled = selectedSpace.state === 'hasData'
    const spaceId = enabled ? selectedSpace.data._id! : ''
    return $rolesQueryOptions(spaceId, enabled)
})
export const $roles = loadableQuery($rolesQuery)
