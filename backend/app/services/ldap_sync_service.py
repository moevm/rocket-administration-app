import asyncio
import logging
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, field

from ldap3 import Connection, Server, ALL, SUBTREE

from app.lib.rocket import rocket_request, rocket_query_args
from app.lib.utils import generate_password, extract_exception_message

logger = logging.getLogger(__name__)

@dataclass
class LDAPConfig:
    host: str                     # адрес LDAP-сервера
    port: int                     
    bind_dn: str
    bind_password: str            
    base_dn: str                  # базовый DN для поиска
    group_role_mapping: Dict[str, str]      # маппинг групп LDAP → роли Rocket.Chat
    group_channel_mapping: Dict[str, str]   # маппинг групп LDAP → каналы Rocket.Chat
    
    use_ssl: bool = False
    user_base_dn: str = "ou=user-accounts,ou=test-zone,dc=moevm,dc=info"
    group_base_dn: str = "ou=user-groups,ou=test-zone,dc=moevm,dc=info"
    user_filter: str = "(objectClass=inetOrgPerson)"
    group_filter: str = "(objectClass=groupOfNames)"
    username_attr: str = "uid"
    email_attr: str = "mail"
    name_attr: str = "cn"                # полное имя (Common Name)
    first_name_attr: str = "givenName"   # имя
    last_name_attr: str = "sn"           # фамилия
    member_of_attr: str = "memberOf"
    deactivate_missing: bool = False
    delete_missing: bool = False
    default_password_length: int = 16
    join_default_channels: bool = False


class LDAPSyncService:
    def __init__(self, config: LDAPConfig, rocket):
        self.config = config       # конфигурация LDAP
        self.rocket = rocket       # объект RocketClient, предоставляющий методы для работы с API Rocket.Chat
        self._conn: Optional[Connection] = None

    async def _connect(self) -> Connection:
        if self._conn is None or not self._conn.bound:
            server = Server(
                self.config.host,
                port=self.config.port,
                use_ssl=self.config.use_ssl,
                get_info=ALL
            )
            self._conn = Connection(
                server,
                self.config.bind_dn,
                self.config.bind_password,
                auto_bind=True
            )
        return self._conn

    async def _disconnect(self):
        if self._conn is not None:
            try:
                self._conn.unbind()
            except Exception:
                pass
            self._conn = None

    async def _run_ldap_sync(self, func, *args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)

    async def _fetch_ldap_users(self) -> List[Dict]:
        conn = await self._connect()

        search_attributes = [
            self.config.username_attr,
            self.config.email_attr,
            self.config.name_attr,
            self.config.first_name_attr,
            self.config.last_name_attr,
            self.config.member_of_attr,
        ]

        def _search():
            conn.search(
                search_base=self.config.user_base_dn,
                search_filter=self.config.user_filter,
                search_scope=SUBTREE,
                attributes=search_attributes,
                paged_size=500
            )

            users = []
            for entry in conn.entries:
                username = str(entry[self.config.username_attr].value) if entry[self.config.username_attr] else ""
                email = str(entry[self.config.email_attr].value) if entry[self.config.email_attr] else ""
                name = str(entry[self.config.name_attr].value) if entry[self.config.name_attr] else ""
                first_name = str(entry[self.config.first_name_attr].value) if entry[self.config.first_name_attr] else ""
                last_name = str(entry[self.config.last_name_attr].value) if entry[self.config.last_name_attr] else ""

                member_of = []
                if entry[self.config.member_of_attr]:
                    member_of = [str(dn) for dn in entry[self.config.member_of_attr].values]

                users.append({
                    "username": username,
                    "email": email,
                    "name": name or f"{first_name} {last_name}".strip() or username,
                    "first_name": first_name,
                    "last_name": last_name,
                    "dn": str(entry.entry_dn),
                    "member_of": member_of,
                    "active": True
                })

            return users

        return await self._run_ldap_sync(_search)

    async def _fetch_ldap_user(self, username: str) -> Optional[Dict]:
        conn = await self._connect()

        search_filter = (
            f"(&{self.config.user_filter}"
            f"({self.config.username_attr}={username}))"
        )

        search_attributes = [
            self.config.username_attr,
            self.config.email_attr,
            self.config.name_attr,
            self.config.first_name_attr,
            self.config.last_name_attr,
            self.config.member_of_attr,
        ]

        def _search_one():
            conn.search(
                search_base=self.config.user_base_dn,
                search_filter=search_filter,
                search_scope=SUBTREE,
                attributes=search_attributes
            )

            if not conn.entries:
                return None

            entry = conn.entries[0]
            username_val = str(entry[self.config.username_attr].value) if entry[self.config.username_attr] else ""
            email_val = str(entry[self.config.email_attr].value) if entry[self.config.email_attr] else ""
            name_val = str(entry[self.config.name_attr].value) if entry[self.config.name_attr] else ""
            first_name = str(entry[self.config.first_name_attr].value) if entry[self.config.first_name_attr] else ""
            last_name = str(entry[self.config.last_name_attr].value) if entry[self.config.last_name_attr] else ""

            member_of = []
            if entry[self.config.member_of_attr]:
                member_of = [str(dn) for dn in entry[self.config.member_of_attr].values]

            return {
                "username": username_val,
                "email": email_val,
                "name": name_val or f"{first_name} {last_name}".strip() or username,
                "first_name": first_name,
                "last_name": last_name,
                "dn": str(entry.entry_dn),
                "member_of": member_of,
                "active": True
            }

        return await self._run_ldap_sync(_search_one)

    async def _get_all_rc_users(self) -> Dict[str, dict]:
        resp = await rocket_request(
            self.rocket.users_list,
            **rocket_query_args(count=0)
        )
        return {user["username"]: user for user in resp.get("users", [])}

    async def _create_rc_user(self, ldap_user: Dict) -> dict:
        password = generate_password(self.config.default_password_length)

        create_args = {
            "username": ldap_user["username"],
            "email": ldap_user["email"] or f"{ldap_user['username']}@moevm.info",
            "name": ldap_user["name"],
            "password": password,
            "verified": True,
            "joinDefaultChannels": self.config.join_default_channels,
            "requirePasswordChange": False,
        }

        try:
            resp = await rocket_request(
                self.rocket.users_create,
                **rocket_query_args(**create_args)
            )
            return resp.get("user", {})
        except Exception as e:
            logger.error(f"Ошибка создания пользователя {ldap_user['username']}: {e}")
            raise

    async def _update_rc_user(self, user_id: str, update_data: Dict):
        if not update_data:
            return
        await rocket_request(
            self.rocket.call_api_post,
            "users.update",
            **rocket_query_args(userId=user_id, data=update_data)
        )

    async def _get_rc_user_info(self, user_id: str) -> dict:
        resp = await rocket_request(
            self.rocket.users_info,
            **rocket_query_args(user_id=user_id)
        )
        return resp.get("user", {})

    async def _get_room_members(self, room_id: str) -> Set[str]:
        try:
            resp = await rocket_request(
                self.rocket.call_api_get,
                "rooms.membersOrderedByRole",
                **rocket_query_args(roomId=room_id, count=0)
            )
            return {member["_id"] for member in resp.get("members", [])}
        except Exception as e:
            logger.warning(f"Не удалось получить членов комнаты {room_id}: {e}")
            return set()

    async def _add_users_to_room(self, room_id: str, user_ids: List[str]):
        import json
        import uuid

        ddp_call = {
            "msg": "method",
            "method": "addUsersToRoom",
            "id": str(uuid.uuid4()),
            "params": [{"rid": room_id, "users": user_ids}]
        }

        await rocket_request(
            self.rocket.call_api_post,
            "method.call/addUsersToRoom",
            **rocket_query_args(message=json.dumps(ddp_call))
        )

    async def _remove_user_from_room(self, room_id: str, user_id: str, room_type: str):
        method = self.rocket.groups_kick if room_type == "p" else self.rocket.channels_kick
        await rocket_request(
            method,
            **rocket_query_args(room_id=room_id, user_id=user_id)
        )

    async def sync_all_users(self) -> Dict[str, int]:
        stats = {"created": 0, "updated": 0, "deactivated": 0, "deleted": 0, "errors": 0}

        try:
            ldap_users = await self._fetch_ldap_users()
            rc_users = await self._get_all_rc_users()

            ldap_usernames = {u["username"] for u in ldap_users if u["username"]}
            rc_usernames = set(rc_users.keys())

            # Обработка пользователей из LDAP
            for ldap_user in ldap_users:
                username = ldap_user["username"]
                if not username:
                    continue

                try:
                    if username in rc_users:
                        # Обновление существующего пользователя
                        rc_user = rc_users[username]
                        update_data = self._compute_user_diff(rc_user, ldap_user)
                        if update_data:
                            await self._update_rc_user(rc_user["_id"], update_data)
                            stats["updated"] += 1
                            logger.info(f"Обновлён пользователь: {username}")
                    else:
                        # Создание нового пользователя
                        await self._create_rc_user(ldap_user)
                        stats["created"] += 1
                        logger.info(f"Создан пользователь: {username}")

                except Exception as e:
                    logger.error(f"Ошибка обработки пользователя {username}: {e}")
                    stats["errors"] += 1

            # Обработка пользователей, отсутствующих в LDAP
            missing_users = rc_usernames - ldap_usernames
            for username in missing_users:
                try:
                    rc_user = rc_users[username]

                    if self.config.delete_missing:
                        # Удаление пользователя
                        await rocket_request(
                            self.rocket.users_delete,
                            **rocket_query_args(
                                user_id=rc_user["_id"],
                                confirmRelinquish=True
                            )
                        )
                        stats["deleted"] += 1
                        logger.info(f"Удалён пользователь: {username}")

                    elif self.config.deactivate_missing:
                        # Деактивация пользователя
                        if rc_user.get("active", True):
                            await self._update_rc_user(rc_user["_id"], {"active": False})
                            stats["deactivated"] += 1
                            logger.info(f"Деактивирован пользователь: {username}")

                except Exception as e:
                    logger.error(f"Ошибка обработки отсутствующего пользователя {username}: {e}")
                    stats["errors"] += 1

        finally:
            await self._disconnect()

        return stats

    def _compute_user_diff(self, rc_user: dict, ldap_user: Dict) -> Dict:
        update_data = {}

        if rc_user.get("name") != ldap_user["name"]:
            update_data["name"] = ldap_user["name"]

        rc_email = ""
        if rc_user.get("emails"):
            rc_email = rc_user["emails"][0].get("address", "")
        ldap_email = ldap_user.get("email", "")
        if ldap_email and rc_email != ldap_email:
            update_data["email"] = ldap_email

        return update_data

    async def update_single_user(self, username: str, ldap_data: Optional[Dict] = None) -> Dict:
        try:
            # Загружаем данные из LDAP, если не переданы
            if ldap_data is None:
                await self._connect()
                ldap_data = await self._fetch_ldap_user(username)
                if ldap_data is None:
                    return {"status": "error", "message": f"Пользователь {username} не найден в LDAP"}

            # Ищем пользователя в Rocket.Chat
            rc_users = await self._get_all_rc_users()
            rc_user = rc_users.get(username)

            if rc_user is None:
                await self._create_rc_user(ldap_data)
                return {"status": "created", "message": f"Пользователь {username} создан"}

            # Обновляем существующего
            update_data = self._compute_user_diff(rc_user, ldap_data)
            if update_data:
                await self._update_rc_user(rc_user["_id"], update_data)
                return {"status": "updated", "message": f"Пользователь {username} обновлён"}

            return {"status": "unchanged", "message": f"Пользователь {username} не требует обновления"}

        except Exception as e:
            logger.error(f"Ошибка обновления пользователя {username}: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            await self._disconnect()

    async def sync_roles_for_all_users(self) -> Dict[str, int]:
        if not self.config.group_role_mapping:
            return {"updated": 0, "errors": 0, "unchanged": 0, "message": "Маппинг ролей не настроен"}

        stats = {"updated": 0, "errors": 0, "unchanged": 0}

        try:
            ldap_users = await self._fetch_ldap_users()
            rc_users = await self._get_all_rc_users()

            # Строим маппинг: username → желаемые роли
            desired_roles = {}
            for ldap_user in ldap_users:
                username = ldap_user["username"]
                roles = set()

                for group_dn in ldap_user.get("member_of", []):
                    if group_dn in self.config.group_role_mapping:
                        roles.add(self.config.group_role_mapping[group_dn])

                if roles:
                    desired_roles[username] = roles

            # Применяем изменения
            mapped_role_values = set(self.config.group_role_mapping.values())

            for username, desired_set in desired_roles.items():
                rc_user = rc_users.get(username)
                if not rc_user:
                    continue

                try:
                    current_roles = set(rc_user.get("roles", []))
                    # Оставляем роли, не участвующие в маппинге
                    other_roles = current_roles - mapped_role_values
                    new_roles = other_roles | desired_set

                    if new_roles != current_roles:
                        await self._update_rc_user(
                            rc_user["_id"],
                            {"roles": list(new_roles)}
                        )
                        stats["updated"] += 1
                        logger.info(f"Обновлены роли пользователя {username}: {sorted(new_roles)}")
                    else:
                        stats["unchanged"] += 1

                except Exception as e:
                    logger.error(f"Ошибка обновления ролей {username}: {e}")
                    stats["errors"] += 1

        finally:
            await self._disconnect()

        return stats

    async def sync_channel_memberships(self) -> Dict[str, int]:
        if not self.config.group_channel_mapping:
            return {"added": 0, "removed": 0, "errors": 0, "message": "Маппинг каналов не настроен"}

        stats = {"added": 0, "removed": 0, "errors": 0}

        try:
            ldap_users = await self._fetch_ldap_users()

            rooms_resp = await rocket_request(
                self.rocket.rooms_admin_rooms,
                **rocket_query_args(types=['c', 'p'], count=0)
            )
            rooms_by_name = {room["name"]: room for room in rooms_resp.get("rooms", [])}

            # Строим маппинг: группа → {usernames}
            group_members = {}
            for ldap_user in ldap_users:
                for group_dn in ldap_user.get("member_of", []):
                    if group_dn in self.config.group_channel_mapping:
                        if group_dn not in group_members:
                            group_members[group_dn] = set()
                        group_members[group_dn].add(ldap_user["username"])

            # Обрабатываем каждую группу
            for group_dn, channel_name in self.config.group_channel_mapping.items():
                room = rooms_by_name.get(channel_name)
                if not room:
                    logger.warning(f"Канал '{channel_name}' не найден в Rocket.Chat")
                    continue

                room_id = room["_id"]
                room_type = room["t"]

                current_member_ids = await self._get_room_members(room_id)

                desired_usernames = group_members.get(group_dn, set())
                rc_users = await self._get_all_rc_users()
                desired_ids = {
                    rc_users[u]["_id"]
                    for u in desired_usernames
                    if u in rc_users
                }

                to_add = desired_ids - current_member_ids
                if to_add:
                    try:
                        await self._add_users_to_room(room_id, list(to_add))
                        stats["added"] += len(to_add)
                        logger.info(f"Добавлено {len(to_add)} пользователей в канал '{channel_name}'")
                    except Exception as e:
                        logger.error(f"Ошибка добавления в канал '{channel_name}': {e}")
                        stats["errors"] += len(to_add)

                to_remove = current_member_ids - desired_ids
                for user_id in to_remove:
                    try:
                        await self._remove_user_from_room(room_id, user_id, room_type)
                        stats["removed"] += 1
                    except Exception as e:
                        logger.error(f"Ошибка удаления пользователя {user_id} из '{channel_name}': {e}")
                        stats["errors"] += 1

        finally:
            await self._disconnect()

        return stats

    async def test_connection(self) -> Dict:
        try:
            conn = await self._connect()

            # Проверяем доступность базового DN
            def _test():
                conn.search(
                    search_base=self.config.base_dn,
                    search_filter="(objectClass=*)",
                    search_scope=SUBTREE,
                    size_limit=1
                )
                return len(conn.entries) > 0

            base_ok = await self._run_ldap_sync(_test)

            if not base_ok:
                return {"success": False, "message": "Не удалось выполнить поиск в базовом DN"}

            # Считаем пользователей
            ldap_users = await self._fetch_ldap_users()

            return {
                "success": True,
                "message": "Подключение успешно",
                "stats": {
                    "users_count": len(ldap_users),
                    "user_base_dn": self.config.user_base_dn,
                    "group_base_dn": self.config.group_base_dn
                }
            }

        except Exception as e:
            return {"success": False, "message": f"Ошибка подключения: {str(e)}"}
        finally:
            await self._disconnect()