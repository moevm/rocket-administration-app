import asyncio

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List

from app.lib.cache import key_for_space
from app.models import RoomDto, RoomInfoDto, RoomSettingsPatchDto
from app.models import UpdateRoomRequest
from app.features.spaces.utils import get_space
from app.models import TeamDto
from app.models import UserDto
from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.utils import batch_execute, generate_password, extract_exception_message, hide_system_messages
from app.config import settings
import logging

from app.models import (
    RoomsImportRequestDto,
    ImportedRoomResultDto,
    RoomCreateDto,
    RoomsDeleteDto,
    RoomDeleteResDto,
    RoomMemberRolesDto,
    RoomMemberRolesResDto,
    RoomRoleTypeDto,
    RoomsArchiveDto, 
    RoomArchiveResDto
)

router = APIRouter()

logger = logging.getLogger(__name__)

@router.get("/")
async def get_rooms(space=Depends(get_space)) -> List[RoomDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    rooms = [
        RoomDto.model_validate(room)
        for room
        in (await rocket_request(
            rocket.rooms_admin_rooms,
            **rocket_query_args(types=['c', 'p'], count=0)
        ))['rooms']
    ]
    return rooms


@router.delete("/")
async def delete_rooms(body: RoomsDeleteDto, space=Depends(get_space)) -> List[RoomDeleteResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process(room: str) -> RoomDeleteResDto:
        res = RoomDeleteResDto(room=room)
        try:
            await rocket_request(
                rocket.call_api_post,
                "rooms.delete",
                **rocket_query_args(roomId=room)
            )
        except Exception as e:
            res.error = extract_exception_message(e)
        else:
            res.success = True
        return res
    
    rooms = await batch_execute(
        _process,
        [(room,) for room in body.rooms],
        settings.app.batch_delay
    )

    return rooms

@router.post("/archive/")
async def archive_rooms(body: RoomsArchiveDto, space=Depends(get_space)) -> List[RoomArchiveResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process(room: str) -> RoomArchiveResDto:
        res = RoomArchiveResDto(room=room)
        try:
            room_info = await rocket_request(rocket.rooms_info, **rocket_query_args(room_id=room))
            room_type = room_info["room"]["t"]

            archive_method = {
                "c": "channels.archive",
                "p": "groups.archive",
            }.get(room_type)

            if archive_method is None:
                raise ValueError(f"Unsupported room type for archiving: {room_type}")

            await rocket_request(
                rocket.call_api_post,
                archive_method,
                **rocket_query_args(roomId=room)
            )

        except Exception as e:
            res.error = extract_exception_message(e)
        else:
            res.success = True
        return res

    rooms = await batch_execute(
        _process,
        [(room,) for room in body.rooms],
        settings.app.batch_delay
    )

    return rooms

@router.post("/unarchive/")
async def unarchive_rooms(body: RoomsArchiveDto, space=Depends(get_space)) -> List[RoomArchiveResDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process(room: str) -> RoomArchiveResDto:
        res = RoomArchiveResDto(room=room)
        try:
            await rocket_request(
                rocket.call_api_post,
                "channels.unarchive",
                **rocket_query_args(roomId=room)
            )
            res.success = True
            return res
        except Exception as e:
            error_msg = extract_exception_message(e)
            if "invalid-room" not in error_msg.lower() and "not a channel" not in error_msg.lower():
                res.error = error_msg
                return res

        try:
            await rocket_request(
                rocket.call_api_post,
                "groups.unarchive",
                **rocket_query_args(roomId=room)
            )
            res.success = True
        except Exception as e:
            res.error = extract_exception_message(e)
        return res

    rooms = await batch_execute(
        _process,
        [(room,) for room in body.rooms],
        settings.app.batch_delay
    )

    return rooms
@router.get("/role-types/")
async def get_room_role_types(space=Depends(get_space)) -> List[RoomRoleTypeDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))
    roles_raw = await rocket_request(rocket.roles_list)

    roles_list = []
    for role in roles_raw.get("roles", []):
        if (role.get("scope") or "").lower() != "subscriptions":
            continue
        role_id = role.get("_id") or role.get("id")
        if not role_id:
            continue
        label = role.get("description") or role.get("name") or role_id
        roles_list.append(RoomRoleTypeDto(id=role_id, label=str(label)))

    return roles_list


@router.get("/{room_id}")
async def get_room_information(room_id: str, space=Depends(get_space)) -> RoomInfoDto:
    rocket = await obtain_rocket_instance(key_for_space(space))

    room_info_raw = None
    room_type = None

    try:
        room_info_raw = await rocket_request(rocket.rooms_info, **rocket_query_args(room_id=room_id))
        room_payload = room_info_raw.get("room")
        if room_payload:
            room_type = room_payload.get("t")
    except Exception:
        pass

    if not room_type:
        for method in ["channels.info", "groups.info"]:
            try:
                resp = await rocket_request(
                    rocket.call_api_get,
                    method,
                    **rocket_query_args(roomId=room_id, includeArchived=True)
                )
                room_info_raw = {"room": resp.get("channel") or resp.get("group")}
                room_type = room_info_raw["room"]["t"]
                break
            except Exception:
                continue

    if not room_type:
        raise HTTPException(status_code=404, detail="Room not found or inaccessible")

    try:
        room_members_raw = await rocket_request(
            rocket.call_api_get,
            method="rooms.membersOrderedByRole",
            **rocket_query_args(roomId=room_id, count=0),
        )
    except Exception:
        room_members_raw = {"members": []}

    try:
        room_roles_raw = await rocket_request(
            rocket.call_api_get, method="rooms.roles", **rocket_query_args(rid=room_id)
        )
    except Exception:
        room_roles_raw = {"roles": []}

    roles_by_user: dict[str, list[str]] = {}
    for item in room_roles_raw.get("roles", []):
        user = item.get("u", {})
        user_id = user.get("_id") if isinstance(user, dict) else getattr(user, "_id", None)
        if user_id:
            user_roles = item.get("roles", [])
            roles_by_user[user_id] = list(user_roles) if user_roles else []

    members_with_roles = []
    for member in room_members_raw.get("members", []):
        member_id = member.get("_id")
        member_copy = dict(member)
        member_copy["roles"] = roles_by_user.get(member_id, [])
        members_with_roles.append(member_copy)

    room_payload = room_info_raw.get("room") or {}
    raw_react = room_payload.get("reactWhenReadOnly")
    react_when_ro = False if raw_react is None else bool(raw_react)

    return RoomInfoDto.model_validate({
        "team": room_info_raw.get("team") if "team" in room_info_raw else None,
        "members": members_with_roles,
        "reactWhenReadOnly": react_when_ro,
    })


@router.patch("/{room_id}/settings")
async def patch_room_settings(
    room_id: str,
    body: RoomSettingsPatchDto,
    space=Depends(get_space),
):
    rocket = await obtain_rocket_instance(key_for_space(space))
    await rocket_request(
        rocket.call_api_post,
        "rooms.saveRoomSettings",
        **rocket_query_args(rid=room_id, reactWhenReadOnly=body.reactWhenReadOnly),
    )
    return {"success": True}


def _get_role_methods(rocket, room_type: str):
    if room_type == "p":
        return {
            "moderator": (rocket.groups_add_moderator, rocket.groups_remove_moderator),
            "leader": (rocket.groups_add_leader, rocket.groups_remove_leader),
            "owner": (rocket.groups_add_owner, rocket.groups_remove_owner),
        }
    if room_type == "c":
        return {
            "moderator": (rocket.channels_add_moderator, rocket.channels_remove_moderator),
            "leader": (rocket.channels_add_leader, rocket.channels_remove_leader),
            "owner": (rocket.channels_add_owner, rocket.channels_remove_owner),
        }
    raise HTTPException(status_code=400, detail="Room type not supported for role management")


@router.post("/{room_id}/members/{user_id}/roles")
async def add_room_member_roles(
    room_id: str,
    user_id: str,
    body: RoomMemberRolesDto,
    space=Depends(get_space),
) -> RoomMemberRolesResDto:
    rocket = await obtain_rocket_instance(key_for_space(space))
    room_info = await rocket_request(
        rocket.rooms_info, **rocket_query_args(room_id=room_id)
    )
    room_type = room_info.get("room", {}).get("t")
    methods = _get_role_methods(rocket, room_type)

    result = RoomMemberRolesResDto()
    for role in body.roles:
        role_lower = role.lower()
        if role_lower not in methods:
            continue
        add_fn, _ = methods[role_lower]
        try:
            await rocket_request(
                add_fn, **rocket_query_args(room_id=room_id, user_id=user_id)
            )
        except Exception as e:
            result.success = False
            result.error = extract_exception_message(e)
            return result
    return result


@router.delete("/{room_id}/members/{user_id}/roles")
async def remove_room_member_roles(
    room_id: str,
    user_id: str,
    body: RoomMemberRolesDto,
    space=Depends(get_space),
) -> RoomMemberRolesResDto:
    rocket = await obtain_rocket_instance(key_for_space(space))
    room_info = await rocket_request(
        rocket.rooms_info, **rocket_query_args(room_id=room_id)
    )
    room_type = room_info.get("room", {}).get("t")
    methods = _get_role_methods(rocket, room_type)

    result = RoomMemberRolesResDto()
    for role in body.roles:
        role_lower = role.lower()
        if role_lower not in methods:
            continue
        _, remove_fn = methods[role_lower]
        try:
            await rocket_request(
                remove_fn, **rocket_query_args(room_id=room_id, user_id=user_id)
            )
        except Exception as e:
            result.success = False
            result.error = extract_exception_message(e)
            return result
    return result



@router.post("/groups/")
async def create_groups(
        body: RoomsImportRequestDto,
        space=Depends(get_space)
) -> List[ImportedRoomResultDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process_group_creation(group_data: RoomCreateDto):
        result = ImportedRoomResultDto(
            request=group_data
        )

        try:
            response_data = await rocket_request(
                rocket.groups_create,
                **rocket_query_args(
                    name=group_data.name,
                    readOnly=group_data.readOnly
                )
            )

            created_group = response_data['group']
            result.created_id = created_group['_id']
            if group_data.disable_system_messages:
                await hide_system_messages(rocket, result.created_id)

        except Exception as e:
            result.error = extract_exception_message(e)

        return result

    tasks_args = [(group,) for group in body.rooms]
    results: List[ImportedRoomResultDto] = await batch_execute(
        _process_group_creation,
        tasks_args,
        settings.app.batch_delay
    )

    return results


@router.post("/channels/")
async def create_channel(
        body: RoomsImportRequestDto,
        space=Depends(get_space)
) -> List[ImportedRoomResultDto]:
    rocket = await obtain_rocket_instance(key_for_space(space))

    async def _process_channel_creation(channel_data: RoomCreateDto):
        result = ImportedRoomResultDto(
            request=channel_data
        )

        try:
            response_data = await rocket_request(
                rocket.channels_create,
                **rocket_query_args(
                    name=channel_data.name,
                    readOnly=channel_data.readOnly,
                    teamId=channel_data.teamId
                )
            )
            created_channel = response_data['channel']
            result.created_id = created_channel['_id']
            if channel_data.disable_system_messages:
                await hide_system_messages(rocket, result.created_id)

        except Exception as e:
            result.error = extract_exception_message(e)

        return result

    tasks_args = [(channel,) for channel in body.rooms]
    results: List[ImportedRoomResultDto] = await batch_execute(
        _process_channel_creation,
        tasks_args,
        settings.app.batch_delay
    )

    return results

GROUP_UPDATE_CONFIG = [
    ('name', 'groups_rename', 'name', 'name'),
    ('readOnly', 'groups_set_read_only', 'read_only', 'ro'),
    ('topic', 'groups_set_topic', 'topic', 'topic'),
    ('announcement', 'groups_set_announcement', 'announcement', 'announcement'),
    ('description', 'groups_set_description', 'description', 'description'),
]

CHANNEL_UPDATE_CONFIG = [
    ('name', 'channels_rename', 'name', 'name'),
    ('readOnly', 'channels_set_read_only', 'read_only', 'ro'),
    ('topic', 'channels_set_topic', 'topic', 'topic'),
    ('announcement', 'channels_set_announcement', 'announcement', 'announcement'),
    ('description', 'channels_set_description', 'description', 'description'),
]

async def _update_room_fields(
    rocket,
    room_id: str,
    room_data: UpdateRoomRequest,
    current_room: dict,
    config: list
):
    """Общая функция для обновления полей комнаты"""
    for field, method_name, arg_name, room_key in config:
        value = getattr(room_data, field)
        if value is not None and value != current_room.get(room_key):
            method = getattr(rocket, method_name)
            await rocket_request(method, **rocket_query_args(room_id=room_id, **{arg_name: value}))

@router.patch("/groups/{room_id}")
async def update_room_group(
    room_id: str,
    room_data: UpdateRoomRequest,
    space=Depends(get_space)
) -> RoomDto:
    """
    Обновляет информацию о комнате (группа)
    """
    rocket = await obtain_rocket_instance(key_for_space(space))

    try:
        room_info = await rocket_request(
            rocket.rooms_info,
            **rocket_query_args(room_id=room_id)
        )

        if not room_info or 'room' not in room_info:
            raise HTTPException(status_code=404, detail="The room is not found")

        room_type = room_info['room']['t']
        if room_type != 'p':
            raise HTTPException(
                status_code=400, 
                detail=f"This rooms' type is {room_type} - group expected"
            )

        current_room = room_info['room']
        await _update_room_fields(rocket, room_id, room_data, current_room, GROUP_UPDATE_CONFIG)

        updated_info = await rocket_request(
            rocket.rooms_info,
            **rocket_query_args(room_id=room_id)
        )

        return RoomDto.model_validate(updated_info['room'])

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to update group: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to update group: {str(e)}"
        )


@router.patch("/channels/{room_id}")
async def update_room_channels(
    room_id: str,
    room_data: UpdateRoomRequest,
    space=Depends(get_space)
) -> RoomDto:
    """
    Обновляет информацию о комнате (канал)
    """
    rocket = await obtain_rocket_instance(key_for_space(space))

    try:
        room_info = await rocket_request(
            rocket.rooms_info,
            **rocket_query_args(room_id=room_id)
        )

        if not room_info or 'room' not in room_info:
            raise HTTPException(status_code=404, detail="The room is not found")

        room_type = room_info['room']['t']
        if room_type != 'c':
            raise HTTPException(
                status_code=400,
                detail=f"This rooms' type is {room_type} - channel expected"
            )

        current_room = room_info['room']

        await _update_room_fields(rocket, room_id, room_data, current_room, CHANNEL_UPDATE_CONFIG)

        updated_info = await rocket_request(
            rocket.rooms_info,
            **rocket_query_args(room_id=room_id)
        )

        return RoomDto.model_validate(updated_info['room'])

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to update channel: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Failed to update channel: {str(e)}"
        )
