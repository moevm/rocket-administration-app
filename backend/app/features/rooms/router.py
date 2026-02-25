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

    room_info_raw, room_members_raw = await asyncio.gather(
        rocket_request(rocket.rooms_info, **rocket_query_args(room_id=room_id)),
        rocket_request(
            rocket.call_api_get,
            method="rooms.membersOrderedByRole",
            **rocket_query_args(roomId=room_id, count=0),
        ),
    )

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
            raise HTTPException(status_code=404, detail="Комната не найдена")

        room_type = room_info['room']['t']
        if room_type != 'p':
            raise HTTPException(
                status_code=400, 
                detail=f"Эта комната имеет тип {room_type} - ожидалась группа:("
            )

        current_room = room_info['room']

        if room_data.name is not None and room_data.name != current_room.get('name'):
            await rocket_request(
                rocket.groups_rename,
                **rocket_query_args(
                    room_id=room_id,
                    name=room_data.name
                )
            )

        if room_data.readOnly is not None and room_data.readOnly != current_room.get('ro'):
            await rocket_request(
                rocket.groups_set_read_only,
                **rocket_query_args(
                    room_id=room_id,
                    read_only=room_data.readOnly
                )
            )

        if room_data.topic is not None and room_data.topic != current_room.get('topic'):
            await rocket_request(
                rocket.groups_set_topic,
                **rocket_query_args(
                    room_id=room_id,
                    topic=room_data.topic
                )
            )

        if room_data.announcement is not None and room_data.announcement != current_room.get('announcement'):
            await rocket_request(
                rocket.groups_set_announcement,
                **rocket_query_args(
                    room_id=room_id,
                    announcement=room_data.announcement
                )
            )

        if room_data.description is not None and room_data.description != current_room.get('description'):
            await rocket_request(
                rocket.groups_set_description,
                **rocket_query_args(
                    room_id=room_id,
                    description=room_data.description
                )
            )

        updated_info = await rocket_request(
            rocket.rooms_info,
            **rocket_query_args(room_id=room_id)
        )

        return RoomDto.model_validate(updated_info['room'])

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка обновления группы: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"Ошибка обновления группы: {str(e)}"
        )


@router.patch("/channels/{room_id}")
async def update_room_channels(
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
            raise HTTPException(status_code=404, detail="Комната не найдена")

        room_type = room_info['room']['t']
        if room_type != 'p':
            raise HTTPException(
                status_code=400,
                detail=f"Эта комната имеет тип {room_type} - ожидался канал:("
            )

        current_room = room_info['room']

        if room_data.name is not None and room_data.name != current_room.get('name'):
            await rocket_request(
                rocket.channels_rename,
                **rocket_query_args(
                    room_id=room_id,
                    name=room_data.name
                )
            )

        if room_data.readOnly is not None and room_data.readOnly != current_room.get('ro'):
            await rocket_request(
                rocket.channels_set_read_only,
                **rocket_query_args(
                    room_id=room_id,
                    read_only=room_data.readOnly
                )
            )

        if room_data.topic is not None and room_data.topic != current_room.get('topic'):
            await rocket_request(
                rocket.channels_set_topic,
                **rocket_query_args(
                    room_id=room_id,
                    topic=room_data.topic
                )
            )

        if room_data.announcement is not None and room_data.announcement != current_room.get('announcement'):
            await rocket_request(
                rocket.channels_set_announcement,
                **rocket_query_args(
                    room_id=room_id,
                    announcement=room_data.announcement
                )
            )

        if room_data.description is not None and room_data.description != current_room.get('description'):
            await rocket_request(
                rocket.channels_set_description,
                **rocket_query_args(
                    room_id=room_id,
                    description=room_data.description
                )
            )

        updated_info = await rocket_request(
            rocket.rooms_info,
            **rocket_query_args(room_id=room_id)
        )

        return RoomDto.model_validate(updated_info['room'])

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка обновления группы: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Ошибка обновления группы: {str(e)}"
        )
