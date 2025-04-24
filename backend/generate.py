import asyncio
import random

from app.lib.rocket import obtain_rocket_instance, rocket_request, rocket_query_args
from app.lib.cache import SpaceCacheKey
import logging

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


async def main():
    space_key = SpaceCacheKey(
        user_id='680a6a1eb742e846a134b5f0',
        token='Alglg7eCgVVWJegt2CJNFMwlI-_EvFfIEOsUeI7tJR5',
        url='http://127.0.0.1:3000/'
    )
    rocket = await obtain_rocket_instance(space_key)

    default_users = 20
    default_teams = 10
    default_channels = 10

    try:
        num_users = int(input(f"Сколько пользователей создать? (Enter для {default_users}): ") or default_users)
        num_channels = int(input(f"Сколько каналов создать? (Enter для {default_channels}): ") or default_channels)
        num_teams = int(input(f"Сколько команд создать? (Enter для {default_teams}): ") or default_teams)
    except ValueError:
        log.error("Неверный ввод. Пожалуйста, введите целые числа.")
        return

    log.info(f"Планируется создать: {num_users} пользователей, {num_channels} каналов, {num_teams} команд.")

    users_to_create = [
        {'email': f'test_user{i}@example.com',
         'password': f'password{i}',
         'username': f'test_user{i}',
         'name': f'Test User{i}',
         'nickname': f'user_{i}',
         'bio': f"I am just user number {i}. I am a test user created for testing.",
         'statusText': f'test_status{i}'
        }
        for i in range(1, num_users + 1)
    ]

    teams_to_create = [
        {'name': f'test_team{i}',
         'type': random.choice([0, 1])
        }
        for i in range(1, num_teams + 1)
    ]

    channels_to_create = [
        {'name': f'test_channel{i}',
         'type': random.choice([0, 1])}
        for i in range(1, num_channels + 1)
    ]

    created_users = []
    for user in users_to_create:
        user_info = await create_user(rocket, user)
        if user_info:
            created_users.append(user_info)

    created_teams = []
    for team in teams_to_create:
        team_info = await create_team(rocket, team)
        if team_info:
            created_teams.append(team_info)

    created_channels = []
    for channel in channels_to_create:
        channel_info = await create_room(rocket, channel)
        if channel_info:
            created_channels.append(channel_info)

    added_to_team_count = 0
    for channel in created_channels:
        if random.random() < 0.5:
            target_team = random.choice(created_teams)
            await add_room_to_team(rocket, channel['roomId'], target_team['teamId'])
            added_to_team_count += 1
    log.info(f"{added_to_team_count} комнат было добавлено в команды")

    max_channels_per_user = min(len(created_channels), 5)
    max_teams_per_user = min(len(created_teams), 2)

    for user in created_users:
        user_id = user['userId']
        username = user['username']
        log.info(f"Распределение пользователя: {username} ({user_id})")

        num_channels_to_join = random.randint(1, max_channels_per_user)
        channels_to_join = random.sample(created_channels, num_channels_to_join)
        log.info(f"  Добавляем в {num_channels_to_join} каналов/групп...")
        for channel in channels_to_join:
            add_func = add_user_to_channel if channel['type'] else add_user_to_group
            await add_func(rocket, user_id, channel['roomId'])
            await asyncio.sleep(0.05)

        num_teams_to_join = random.randint(0, max_teams_per_user)
        teams_to_join = random.sample(created_teams, num_teams_to_join)
        log.info(f"  Добавляем в {num_teams_to_join} команд...")
        for team in teams_to_join:
            await add_user_to_team(rocket, user_id, team['teamId'])
            await asyncio.sleep(0.05)

        await asyncio.sleep(0.1)


async def create_user(rocket, user_data):
    """Creates a user"""

    response = await rocket_request(
        rocket.users_create,
        **rocket_query_args(
            email=user_data['email'],
            password=user_data['password'],
            username=user_data['username'],
            name=user_data.get('name', user_data['username'])
        )
    )

    created_user = response['user']
    log.info(f"Пользователь {created_user['username']} создан с ID: {created_user['_id']}")
    return {
        'userId': created_user['_id'],
        'username': created_user['username']
    }


async def create_team(rocket, team_data):
    """Creates a team"""
    response = await rocket_request(
        rocket.teams_create,
        **rocket_query_args(
            name=team_data['name'],
            team_type=team_data['type']
        )
    )

    created_team = response['team']
    log.info(f"Команда {created_team['name']} создана с ID: {created_team['_id']}, тип - {created_team['type']}")
    return {
        'teamId': created_team['_id'],
        'name': created_team['name'],
        'type': created_team['type']
    }


async def create_room(rocket, channel_data):
    """Creates a room"""
    if channel_data['type'] == 0:
        response = await rocket_request(
            rocket.groups_create,
            **rocket_query_args(
                name=channel_data['name']
            )
        )
        created_room = response['group']
        log.info(f"Приватная комната {created_room['name']} создана. ID - {created_room['_id']}")
    else:
        response = await rocket_request(
            rocket.channels_create,
            **rocket_query_args(
                name=channel_data['name']
            )
        )
        created_room = response['channel']
        log.info(f"Публичная комната {created_room['name']} создана. ID - {created_room['_id']}")
    return {
        'roomId': created_room['_id'],
        'name': created_room['name'],
        'type': channel_data['type']
    }


async def add_user_to_channel(rocket, user_id, channel_id):
    await rocket_request(
        rocket.channels_invite,
        **rocket_query_args(
            room_id=channel_id,
            user_id=user_id
        )

    )


async def add_user_to_group(rocket, user_id, group_id):
    await rocket_request(
        rocket.groups_invite,
        **rocket_query_args(
            room_id=group_id,
            user_id=user_id
        )
    )


async def add_user_to_team(rocket, user_ids, team_id):
    if not isinstance(user_ids, list):
        user_ids = [user_ids]
        members_payload = [{'userId': uid} for uid in user_ids]
        await rocket_request(
            rocket.teams_add_members,
            **rocket_query_args(
                team_id=team_id,
                members=members_payload
            )
        )


async def add_room_to_team(rocket, room_id, team_id):
    await rocket_request(
        rocket.teams_add_rooms,
        **rocket_query_args(
            team_id=team_id,
            rooms=[room_id]
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
