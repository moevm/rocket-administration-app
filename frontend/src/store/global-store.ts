import {atom} from "jotai";
import {$api, loadableQuery} from "@/api";
import {atomWithQuery} from 'jotai-tanstack-query'
import {loadable} from "jotai/utils";
import {components} from "@/schema";

export type ApiUserModel = components['schemas']['UserDto']
export type ApiRoomModel = components['schemas']['RoomDto']
export type ApiTeamModel = components['schemas']['TeamDto']
export type ApiSpaceModel = components['schemas']['SpaceDto']
export type ApiUserInfoRoomModel = components['schemas']['UserInfoRoomDto']

export const $spacesQueryOptions = () => $api.queryOptions('get', '/spaces/', {})
export const $spacesQuery = atomWithQuery(() => $spacesQueryOptions())
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

export const $smtpSettingsQueryOptions = (spaceId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/settings/smtp`,
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

export const $smtpSettingsQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace)
    const enabled = selectedSpace.state === 'hasData'
    const spaceId = enabled ? selectedSpace.data._id! : ''
    return $smtpSettingsQueryOptions(spaceId, enabled)
})

export const $smtpSettings = loadableQuery($smtpSettingsQuery)

export const $roomsQueryOptions = (spaceId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/rooms/`,
    {
        params: {
            path: {
                space_id: spaceId
            },
        },
    },
    {
        enabled
    }
);
export const $roomsQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace)
    const enabled = selectedSpace.state === 'hasData'
    const spaceId = enabled ? selectedSpace.data._id! : ''
    return $roomsQueryOptions(spaceId, enabled)
})
export const $rooms = loadableQuery($roomsQuery)

export const $teamsQueryOptions = (spaceId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/teams/`,
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
export const $teamsQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace)
    const enabled = selectedSpace.state === 'hasData'
    const spaceId = enabled ? selectedSpace.data._id! : ''
    return $teamsQueryOptions(spaceId, enabled)
})
export const $teams = loadableQuery($teamsQuery)


export const $selectedUserId = atom<string | null>(null)

export const $selectedUser = loadable(atom(async (get) => {
    const users = await get($usersQuery).promise
    const selectedUserId = get($selectedUserId)
    const result = users.find(it => it._id === selectedUserId)

    if (!result) {
        throw Error('User not found: ' + selectedUserId)
    }

    return result
}))

export const $userInfoQueryOptions = (spaceId: string, userId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/users/{user_id}`,
    {
        params: {
            path: {
                space_id: spaceId,
                user_id: userId
            }
        },
    },
    {
        enabled
    }
);
export const $userInfoQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace);
    const selectedUser = get($selectedUser);
    const enabled = selectedSpace.state === 'hasData' && selectedUser.state === "hasData";
    const spaceId = enabled ? selectedSpace.data._id! : ''
    const userId = enabled ? selectedUser.data._id! : ''
    return $userInfoQueryOptions(spaceId, userId, enabled)
})
export const $userInfo = loadableQuery($userInfoQuery)



