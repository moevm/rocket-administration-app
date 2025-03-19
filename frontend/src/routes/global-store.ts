import {atom} from "jotai";
import {$api, loadableQuery} from "@/api";
import {atomWithQuery} from 'jotai-tanstack-query'
import {loadable} from "jotai/utils";

export const $spacesQueryOptions = $api.queryOptions('get', '/spaces')
export const $spacesQuery = atomWithQuery(() => $spacesQueryOptions)
export const $spaces = loadableQuery($spacesQuery)

export const $selectedSpaceId = atom<string | null>(null)

export const $selectedSpace = loadable(atom(async (get) => {
   const spaces = await get($spacesQuery).promise
   const selectedSpaceId = get($selectedSpaceId)
   const result = spaces.find(it => it._id === selectedSpaceId)

   if (!result) {
      throw Error('Space not found: ' + selectedSpaceId)
   }

   return result
}))

export const $usersQueryOptions = $api.queryOptions('get', `/spaces/{space_id}/users/`)
export const $usersQuery = atomWithQuery(() => $usersQueryOptions)
export const users = loadableQuery($usersQuery)

