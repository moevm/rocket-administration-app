import asyncio
import logging
from typing import List, Dict, Any, Optional, Set

from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.cache import SpaceCacheKey

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

API_CALL_DELAY = 0.1
ADMIN_USER_ID = '680a6a1eb742e846a134b5f0'

KEEP_USER_IDS: Set[str] = {ADMIN_USER_ID, 'rocket.cat'}
KEEP_TEAM_IDS: Set[str] = {}
KEEP_ROOM_IDS: Set[str] = {"GENERAL"}


async def main():
    space_key = SpaceCacheKey(
        user_id=ADMIN_USER_ID,
        token='Alglg7eCgVVWJegt2CJNFMwlI-_EvFfIEOsUeI7tJR5',
        url='http://127.0.0.1:3000/'
    )
    rocket = await obtain_rocket_instance(space_key)

    log.info("--- Запуск процесса удаления ---")
    log.info(f"ID пользователей для сохранения: {KEEP_USER_IDS}")
    log.info(f"ID команд для сохранения: {KEEP_TEAM_IDS}")
    log.info(f"ID комнат для сохранения: {KEEP_ROOM_IDS}")

    users_response = await rocket_request(rocket.users_list, **rocket_query_args())
    users_to_process = users_response.get('users', [])

    teams_response = await rocket_request(rocket.teams_list_all, **rocket_query_args())
    teams_to_process = teams_response.get('teams', [])

    channels_response = await rocket_request(rocket.channels_list, **rocket_query_args())
    channels_to_process = channels_response.get('channels', [])

    groups_response = await rocket_request(rocket.groups_list, **rocket_query_args())
    groups_to_process = groups_response.get('groups', [])

    all_rooms_to_process = channels_to_process + groups_to_process

    log.info(
        f"Найдено для обработки: {len(users_to_process)} польз., {len(teams_to_process)} команд, {len(all_rooms_to_process)} комнат.")

    dissociated_rooms_count = 0
    for team in teams_to_process:
        team_id = team.get('_id')
        team_name = team.get('name', team_id)
        if team_id not in KEEP_TEAM_IDS:
            log.debug(f"Обработка команды для отсоединения комнат: {team_name} ({team_id})")
            team_rooms_response = await rocket_request(rocket.teams_list_rooms, **rocket_query_args(team_id=team_id))
            team_rooms = team_rooms_response.get('rooms', [])
            for room in team_rooms:
                room_id = room.get('_id')
                room_name = room.get('name')
                log.info(f"  Отсоединяем комнату {room_name} ({room_id}) от команды {team_name}")
                await rocket_request(rocket.teams_remove_room, **rocket_query_args(team_id=team_id, room_id=room_id))
                dissociated_rooms_count += 1
                await asyncio.sleep(API_CALL_DELAY)
    log.info(f"Отсоединение комнат от команд завершено. Выполнено операций отсоединения: {dissociated_rooms_count}")

    deleted_users_count = 0
    for user in users_to_process:
        user_id = user.get('_id')
        if user_id not in KEEP_USER_IDS:
            log.info(f'Удаляем пользователя {user_id}')
            await rocket_request(rocket.users_delete, **rocket_query_args(user_id=user_id))
            deleted_users_count += 1
            await asyncio.sleep(API_CALL_DELAY)
        elif user_id in KEEP_USER_IDS:
            log.debug(f"Пропуск пользователя (сохраняемый): {user.get('username', user_id)}")
    log.info('Пользователи удалены')

    deleted_teams_count = 0
    for team in teams_to_process:
        team_id = team.get('_id')
        if team_id not in KEEP_TEAM_IDS and team.get('name') != 'general':
            log.info(f'Удаляем команду {team_id}')
            await rocket_request(rocket.teams_delete, **rocket_query_args(team_id=team_id))
            deleted_teams_count += 1
            await asyncio.sleep(API_CALL_DELAY)
        elif team_id in KEEP_TEAM_IDS:
            log.debug(f"Пропуск команды (сохраняемая): {team.get('name', team_id)}")
    log.info('Команды удалены')

    deleted_rooms_count = 0
    for room in all_rooms_to_process:
        room_id = room.get('_id')
        room_type = room.get('t')
        if room_type not in KEEP_ROOM_IDS:
            endpoint = None
            if room_type == 'c':
                endpoint = rocket.channels_delete
            elif room_type == 'p':
                endpoint = rocket.groups_delete
            if endpoint:
                log.info(f'Удаляем комнату {room_id}')
                await rocket_request(endpoint, **rocket_query_args(room_id=room_id))
                deleted_rooms_count += 1
                await asyncio.sleep(API_CALL_DELAY)
            else:
                log.warning(f"Пропуск комнаты с неизвестным типом '{room_type}': {room.get('name', room_id)}")
        elif room_id in KEEP_ROOM_IDS:
            log.debug(f"Пропуск комнаты (сохраняемая): {room.get('name', room_id)}")
    log.info('Комнаты удалены')

    log.info("--- Итоги удаления ---")
    log.info(f"Пользователи: удалено {deleted_users_count} из {len(users_to_process)} обработанных.")
    log.info(f"Команды: удалено {deleted_teams_count} из {len(teams_to_process)} обработанных.")
    log.info(f"Комнаты: удалено {deleted_rooms_count} из {len(all_rooms_to_process)} обработанных.")
    log.warning("Процесс удаления завершен.")


if __name__ == "__main__":
    asyncio.run(main())