import {$api, createMutationOptions} from "@/api";
import {useInvalidateRooms} from "@/api/invalidate.ts";
import {Checkbox} from "@/components/ui/checkbox.tsx";

export function RoomReactWhenReadOnlySetting(props: {
    spaceId: string
    roomId: string
    value: boolean
}) {
    const invalidateRooms = useInvalidateRooms()
    const {mutate, isPending} = $api.useMutation(
        "patch",
        "/spaces/{space_id}/rooms/{room_id}/settings",
        createMutationOptions({
            onSuccess: async () => {
                await invalidateRooms()
            },
        }),
    )

    return (
        <Checkbox
            checked={props.value}
            disabled={isPending}
            onCheckedChange={(v) => {
                if (v === "indeterminate") {
                    return
                }
                mutate({
                    body: {reactWhenReadOnly: Boolean(v)},
                    params: {
                        path: {
                            space_id: props.spaceId,
                            room_id: props.roomId,
                        },
                    },
                })
            }}
        />
    )
}
