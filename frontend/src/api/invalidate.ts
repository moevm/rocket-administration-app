import {queryClient} from "@/api/index.ts";
import {
    $roomInfoQueryOptions,
    $roomsQueryOptions,
    $selectedRoomId,
    $selectedSpaceId,
    $selectedTeamId,
    $selectedUserId, $spacesQueryOptions,
    $teamInfoQueryOptions,
    $teamsQueryOptions,
    $userInfoQueryOptions,
    $usersQueryOptions
} from "@/store/global-store.ts";
import {useAtomValue} from "jotai";
import {useCallback} from "react";

export const useInvalidateTeams = () => {
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const selectedRoomId = useAtomValue($selectedRoomId)
    const selectedTeamId = useAtomValue($selectedTeamId)
    const selectedUserId = useAtomValue($selectedUserId)

    return useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: $teamsQueryOptions(selectedSpaceId!, true).queryKey
        })
        if (selectedRoomId) {
            queryClient.invalidateQueries({
                queryKey: $roomInfoQueryOptions(selectedSpaceId!, selectedRoomId, true).queryKey
            })
        }
        if (selectedTeamId) {
            queryClient.invalidateQueries({
                queryKey: $teamInfoQueryOptions(selectedSpaceId!, selectedTeamId, true).queryKey
            })
        }
        if (selectedUserId) {
            queryClient.invalidateQueries({
                queryKey: $userInfoQueryOptions(selectedSpaceId!, selectedUserId, true).queryKey
            })
        }
    }, [selectedRoomId, selectedSpaceId, selectedTeamId, selectedUserId])
}

export const useInvalidateRooms = () => {
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const selectedRoomId = useAtomValue($selectedRoomId)
    const selectedTeamId = useAtomValue($selectedTeamId)
    const selectedUserId = useAtomValue($selectedUserId)

    return useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: $roomsQueryOptions(selectedSpaceId!, true).queryKey
        })
        if (selectedRoomId) {
            queryClient.invalidateQueries({
                queryKey: $roomInfoQueryOptions(selectedSpaceId!, selectedRoomId, true).queryKey
            })
        }
        if (selectedTeamId) {
            queryClient.invalidateQueries({
                queryKey: $teamInfoQueryOptions(selectedSpaceId!, selectedTeamId, true).queryKey
            })
        }
        if (selectedUserId) {
            queryClient.invalidateQueries({
                queryKey: $userInfoQueryOptions(selectedSpaceId!, selectedUserId, true).queryKey
            })
        }
    }, [selectedRoomId, selectedSpaceId, selectedTeamId, selectedUserId])
}

export const useInvalidateUsers = () => {
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const selectedRoomId = useAtomValue($selectedRoomId)
    const selectedTeamId = useAtomValue($selectedTeamId)
    const selectedUserId = useAtomValue($selectedUserId)

    return useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: $usersQueryOptions(selectedSpaceId!, true).queryKey
        })
        if (selectedRoomId) {
            queryClient.invalidateQueries({
                queryKey: $roomInfoQueryOptions(selectedSpaceId!, selectedRoomId, true).queryKey
            })
        }
        if (selectedTeamId) {
            queryClient.invalidateQueries({
                queryKey: $teamInfoQueryOptions(selectedSpaceId!, selectedTeamId, true).queryKey
            })
        }
        if (selectedUserId) {
            queryClient.invalidateQueries({
                queryKey: $userInfoQueryOptions(selectedSpaceId!, selectedUserId, true).queryKey
            })
        }
    }, [selectedRoomId, selectedSpaceId, selectedTeamId, selectedUserId])
}

export const useInvalidateSpace = () => {
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const selectedRoomId = useAtomValue($selectedRoomId)
    const selectedTeamId = useAtomValue($selectedTeamId)
    const selectedUserId = useAtomValue($selectedUserId)

    return useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: $spacesQueryOptions().queryKey
        })
        if (selectedSpaceId) {
            queryClient.invalidateQueries({
                queryKey: $usersQueryOptions(selectedSpaceId!, true).queryKey
            })
            queryClient.invalidateQueries({
                queryKey: $teamsQueryOptions(selectedSpaceId!, true).queryKey
            })
            queryClient.invalidateQueries({
                queryKey: $roomsQueryOptions(selectedSpaceId!, true).queryKey
            })
            if (selectedRoomId) {
                queryClient.invalidateQueries({
                    queryKey: $roomInfoQueryOptions(selectedSpaceId!, selectedRoomId, true).queryKey
                })
            }
            if (selectedTeamId) {
                queryClient.invalidateQueries({
                    queryKey: $teamInfoQueryOptions(selectedSpaceId!, selectedTeamId, true).queryKey
                })
            }
            if (selectedUserId) {
                queryClient.invalidateQueries({
                    queryKey: $userInfoQueryOptions(selectedSpaceId!, selectedUserId, true).queryKey
                })
            }
        }
    }, [selectedRoomId, selectedSpaceId, selectedTeamId, selectedUserId])
}

export const useInvalidateEntities = () => {
    const selectedSpaceId = useAtomValue($selectedSpaceId)
    const selectedRoomId = useAtomValue($selectedRoomId)
    const selectedTeamId = useAtomValue($selectedTeamId)
    const selectedUserId = useAtomValue($selectedUserId)

    return useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: $usersQueryOptions(selectedSpaceId!, true).queryKey
        })
        queryClient.invalidateQueries({
            queryKey: $teamsQueryOptions(selectedSpaceId!, true).queryKey
        })
        queryClient.invalidateQueries({
            queryKey: $roomsQueryOptions(selectedSpaceId!, true).queryKey
        })
        if (selectedRoomId) {
            queryClient.invalidateQueries({
                queryKey: $roomInfoQueryOptions(selectedSpaceId!, selectedRoomId, true).queryKey
            })
        }
        if (selectedTeamId) {
            queryClient.invalidateQueries({
                queryKey: $teamInfoQueryOptions(selectedSpaceId!, selectedTeamId, true).queryKey
            })
        }
        if (selectedUserId) {
            queryClient.invalidateQueries({
                queryKey: $userInfoQueryOptions(selectedSpaceId!, selectedUserId, true).queryKey
            })
        }
    }, [selectedRoomId, selectedSpaceId, selectedTeamId, selectedUserId])
}
