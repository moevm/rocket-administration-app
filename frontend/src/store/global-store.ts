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
export type ApiRoomUserModel = components['schemas']["RoomUserDto"]
export type ApiShortTeamModel = components['schemas']['ShortTeamDto']

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


export const $selectedRoomId = atom<string | null>(null)

export const $selectedRoom = loadable(atom(async (get) => {
    const rooms = await get($roomsQuery).promise
    const selectedRoomId = get($selectedRoomId)
    const result = rooms.find(it => it._id === selectedRoomId)

    if (!result) {
        throw Error('Room not found: ' + selectedRoomId)
    }

    return result
}))

export const $roomInfoQueryOptions = (spaceId: string, roomId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/rooms/{room_id}`,
    {
        params: {
            path: {
                space_id: spaceId,
                room_id: roomId
            }
        },
    },
    {
        enabled
    }
);

export const $roomInfoQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace);
    const selectedRoom = get($selectedRoom);
    const enabled = selectedSpace.state === 'hasData' && selectedRoom.state === "hasData";
    const spaceId = enabled ? selectedSpace.data._id! : ''
    const roomId = enabled ? selectedRoom.data._id! : ''
    return $roomInfoQueryOptions(spaceId, roomId, enabled)
})

export const $roomInfo = loadableQuery($roomInfoQuery)


export const $selectedTeamId = atom<string | null>(null)

export const $selectedTeam = loadable(atom(async (get) => {
    const teams = await get($teamsQuery).promise
    const selectedTeamId = get($selectedTeamId)
    const result = teams.find(it => it._id === selectedTeamId)

    if (!result) {
        throw Error('Team not found: ' + selectedTeamId)
    }

    return result
}))

export const $teamInfoQueryOptions = (spaceId: string, teamId: string, enabled: boolean) => $api.queryOptions(
    'get',
    `/spaces/{space_id}/teams/{team_id}`,
    {
        params: {
            path: {
                space_id: spaceId,
                team_id: teamId
            }
        },
    },
    {
        enabled
    }
);

export const $teamInfoQuery = atomWithQuery((get) => {
    const selectedSpace = get($selectedSpace);
    const selectedTeam = get($selectedTeam);
    const enabled = selectedSpace.state === 'hasData' && selectedTeam.state === "hasData";
    const spaceId = enabled ? selectedSpace.data._id! : ''
    const teamId = enabled ? selectedTeam.data._id! : ''
    return $teamInfoQueryOptions(spaceId, teamId, enabled)
})

export const $teamInfo = loadableQuery($teamInfoQuery)
