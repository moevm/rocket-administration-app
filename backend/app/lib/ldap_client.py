from typing import List, Dict, Optional, Any, Callable
from contextlib import contextmanager
import logging
from datetime import datetime
from ldap3 import Server, Connection, ALL, SUBTREE, SIMPLE, SYNC, ASYNC
from ldap3.core.exceptions import (
    LDAPException,
    LDAPBindError,
    LDAPSocketOpenError,
    LDAPSessionTerminatedByServerError,
    LDAPInvalidFilterError
)
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)
import time
from collections import deque
from threading import Lock
from contextvars import ContextVar

logger = logging.getLogger(__name__)


class LDAPConnectionError(Exception):
    pass


class LDAPQueryError(Exception):
    pass


class LDAPConfigError(Exception):
    pass


class LDAPClient:
    def __init__(self, config, use_async: bool = False, cache_ttl: int = 60):
        """
            The class for client initialization
        """

        self._validate_config(config)
        self.config = config  # LDAPSettings obj
        self.use_async = use_async
        self._connection_pool = deque(maxlen=10)  # reduce pool size
        self._pool_lock = Lock()
        self._pool_size = 5
        self._stats = {
            'queries': 0,
            'errors': 0,
            'avg_response_time': 0,
            'last_query_time': None,
            'total_time': 0,
            'cache_hits': 0,
            'cache_misses': 0
        }

        self._cache = {}
        self._cache_ttl = cache_ttl  # time to love in seconds (0 to disable cache)
        self._cache_lock = Lock()

        self._query_times = deque(maxlen=100)  # last 100 requests for performance metrics

    def _validate_config(self, config):
        """
            Method for data validaying before initialization
        """

        required_attrs = ["host", "port", "bind_dn",
                          "bind_password", "base_dn"]
        for attr in required_attrs:
            if not hasattr(config, attr):
                raise LDAPConfigError(f"Missing required config attribute: {attr}")

        if not isinstance(config.port, int) or config.port < 1 or config.port > 65535:
            raise LDAPConfigError(f"Invalid port number: {config.port}")

        if hasattr(config, 'connection_timeout'):
            if config.connection_timeout <= 0:
                raise LDAPConfigError(f"Invalid connection timeout: {config.connection_timeout}")

    def _create_connection(self) -> Connection:
        """
            Method for creating new LDAP connection
        """

        try:
            server = Server(
                self.config.host,
                port=self.config.port,
                use_ssl=self.config.use_ssl,
                get_info=ALL,
                connect_timeout=self.config.connection_timeout
            )

            client_strategy = ASYNC if self.use_async else SYNC

            connection = Connection(
                server,
                user=self.config.bind_dn,
                password=self.config.bind_password,
                authentication=SIMPLE,
                client_strategy=client_strategy,
                auto_bind=False,
                raise_exceptions=True,
                auto_referrals=False
            )

            start_time = time.time()
            connection.bind()
            bind_time = time.time() - start_time

            logger.info(
                f"Connected to LDAP {self.config.host}:{self.config.port} "
                f"(bind time: {bind_time:.2f}s, strategy: {'async' if self.use_async else 'sync'})"
            )

            return connection

        except LDAPBindError as e:
            raise LDAPConnectionError(f"LDAP bind failed - check credentials: {e}")
        except LDAPSocketOpenError as e:
            raise LDAPConnectionError(f"Cannot connect to LDAP server {self.config.server}:{self.config.port}: {e}")
        except Exception as e:
            raise LDAPConnectionError(f"Unexpected error while connecting: {e}")

    def _get_from_cache(self, key: str) -> Optional[Any]:
        """
            Method for getting data from cache
        """

        if self._cache_ttl <= 0:
            return None

        with self._cache_lock:
            if key in self._cache:
                data, timestamp = self._cache[key]
                if time.time() - timestamp < self._cache_ttl:
                    self._stats['cache_hits'] += 1
                    return data
                else:
                    del self._cache[key]  # cache is rotten (ew), delete!

            self._stats['cache_misses'] += 1
            return None

    def _set_to_cache(self, key: str, value: Any):
        """
            Method for cache write
        """
        if self._cache_ttl <= 0:
            logger.debug("LDAp cache is disabled! Write skipped")
            return

        with self._cache_lock:
            self._cache[key] = (value, time.time())

            if len(self._cache) > 1000:
                now = time.time()
                expired_keys = [
                    k for k, (_, ts) in self._cache.items()
                    if now - ts > self._cache_ttl
                ]
                for k in expired_keys:
                    del self._cache[k]

    def _clear_cache(self):
        """
            Method for clearing cache
        """

        with self._cache_lock:
            self._cache.clear()
            logger.info("LDAP cache cleared")

    @contextmanager
    def connection(self):
        """
            Context manager for handling connection
        """

        connection = None

        # try to get connection from pool
        with self._pool_lock:
            if self._connection_pool:
                connection = self._connection_pool.pop()

        # ...or create new
        if connection is None:
            connection = self._create_connection()

        try:
            if not connection.bound:
                logger.warning("Connection is not bound, rebinding...")
                connection.bind()

            yield connection

        except (LDAPSessionTerminatedByServerError, LDAPException, ConnectionError) as e:
            logger.warning(f"LDAP connection broken, recreating: {e}")
            try:
                connection.unbind()
            except Exception:
                pass
            connection = self._create_connection()
            yield connection
        finally:
            with self._pool_lock:
                if len(self._connection_pool) < self._pool_size:
                    self._connection_pool.append(connection)
                else:
                    connection.unbind()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((LDAPConnectionError, LDAPSessionTerminatedByServerError)),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    def search(
        self,
        search_base: str,  # DN
        search_filter: str,
        attributes: List[str] = None,  # attributes to get
        size_limit: int = 0,  # limit of the data amount
        time_limit: int = 0,
        use_cache: bool = True,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
            Methid for LDAP search with automatic retry and caching
        """

        cache_key = None
        if use_cache and self._cache_ttl > 0:
            cache_key = f"{search_base}:{search_filter}:{sorted(attributes or [])}:{size_limit}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for query: {search_filter}")
                return cached_result

        start_time = time.time()
        self._stats['queries'] += 1

        if attributes is None:
            attributes = ['*']

        if not search_filter or not search_filter.startswith('('):
            search_filter = f"({search_filter})"

        try:
            search_base = search_base.format(base_dn=self.config.base_dn)
        except KeyError as e:
            raise LDAPQueryError(f"Invalid placeholder in search_base: {e}")

        logger.info(f"LDAP search: base={search_base}, filter={search_filter}")

        with self.connection() as conn:
            try:
                valid_attributes = self._validate_attributes(conn, attributes)

                success = conn.search(
                    search_base=search_base,
                    search_filter=search_filter,
                    search_scope=SUBTREE,
                    attributes=valid_attributes,
                    size_limit=size_limit if size_limit > 0 else 0,
                    time_limit=time_limit if time_limit > 0 else 0
                )

                if not success:
                    logger.debug(f"LDAP search returned no results: {search_filter}")
                    return []

                results = self._entries_to_dict(conn.entries, attributes)

                query_time = time.time() - start_time
                self._update_stats(query_time)

                logger.debug(f"LDAP search returned {len(results)} entries in {query_time:.2f}s")

                if cache_key and results:
                    self._set_to_cache(cache_key, results)

                return results

            except LDAPInvalidFilterError as e:
                self._stats['errors'] += 1
                logger.error(f"Invalid LDAP filter: {search_filter}")
                raise LDAPQueryError(f"Invalid search filter: {e}")
            except LDAPException as e:
                self._stats['errors'] += 1
                logger.error(f"LDAP search failed: {e}")
                raise LDAPQueryError(f"Search failed: {e}")

    def _validate_attributes(self, connection: Connection, attributes: List[str]) -> List[str]:
        """
            Method to validate data before request
        """

        if not connection.server or not connection.server.schema:
            return attributes

        valid_attrs = []
        for attr in attributes:
            if attr == '*' or attr == 'dn':
                valid_attrs.append(attr)
            elif attr in connection.server.schema.attribute_types:
                valid_attrs.append(attr)
            else:
                logger.warning(f"Attribute '{attr}' not found in schema, skipping")

        return valid_attrs if valid_attrs else ['*']

    def _entries_to_dict(self, entries, requested_attributes: List[str]) -> List[Dict]:
        """
            Convert LDAp entries to dictionary
        """

        results = []

        for entry in entries:
            result = {
                'dn': entry.entry_dn,
                'attributes': {}
            }

            attrs_to_get = requested_attributes if requested_attributes != ['*'] else entry.entry_attributes

            for attr in attrs_to_get:
                if attr == '*':
                    for entry_attr in entry.entry_attributes:
                        value = getattr(entry, entry_attr, None)
                        if value:
                            result['attributes'][entry_attr] = self._format_value(value)
                else:
                    if hasattr(entry, attr):
                        value = getattr(entry, attr)
                        if value:
                            result['attributes'][attr] = self._format_value(value)

            results.append(result)

        return results

    def _format_value(self, value) -> Any:
        """
            Method for value formatting
        """

        if isinstance(value, list):
            if len(value) == 1:
                return self._format_single_value(value[0])
            return [self._format_single_value(v) for v in value]
        return self._format_single_value(value)

    def _format_single_value(self, value) -> Any:
        """
            Method for SINGLE value formatting
        """

        if value is None:
            return None
        if isinstance(value, bytes):
            try:
                return value.decode('utf-8')
            except UnicodeDecodeError:
                return value.hex()
        return str(value)

    def _update_stats(self, query_time: float):
        """
            Method for updating request stats with query time
        """

        total_queries = self._stats['queries']
        current_avg = self._stats['avg_response_time']

        if total_queries == 1:
            self._stats['avg_response_time'] = query_time
        else:
            alpha = 0.3 
            self._stats['avg_response_time'] = alpha * query_time + (1 - alpha) * current_avg

        self._stats['last_query_time'] = query_time
        self._stats['total_time'] += query_time
        self._query_times.append(query_time)

    def get_user_by_id(self, user_id: str, use_cache: bool = True) -> Optional[Dict]:
        """
            Method for getting user data via id
        """

        if not user_id:
            logger.warning("Empty user_id provided")
            return None

        search_base = self.config.users_base
        search_filter = f"(&{self.config.user_filter}({self.config.user_id_attr}={self._escape_filter(user_id)}))"

        results = self.search(search_base, search_filter, size_limit=1, use_cache=use_cache)

        return results[0] if results else None

    def get_users_by_group(self, group_dn: str, use_cache: bool = True) -> List[Dict]:
        """
            Method for getting all users of a group (with memberOf attribute)
        """

        if not group_dn:
            logger.warning("Empty group_dn provided")
            return []

        search_base = self.config.users_base
        search_filter = f"(&{self.config.user_filter}(memberOf={self._escape_filter(group_dn)}))"

        return self.search(
            search_base,
            search_filter,
            attributes=[self.config.user_id_attr, self.config.user_name_attr, 
                       self.config.user_email_attr, 'memberOf'],
            use_cache=use_cache
        )

    def get_user_groups(self, username: str, use_cache: bool = True) -> List[str]:
        """
            Method for getting list of groups in which user is member
        """

        user = self.get_user_by_id(username, use_cache=use_cache)

        if not user:
            logger.warning(f"User '{username}' not found")
            return []

        if 'memberOf' in user['attributes']:
            groups = user['attributes']['memberOf']
            if isinstance(groups, list):
                return groups
            return [groups] if groups else []

        return []

    def get_all_groups(self, use_cache: bool = True) -> List[Dict]:
        """
            Method for getting all LDAP groups
        """

        search_base = self.config.groups_base

        return self.search(
            search_base,
            self.config.group_filter,
            attributes=['cn', 'member', 'description'],
            use_cache=use_cache
        )

    def get_group_members(self, group_dn: str, use_cache: bool = True) -> List[str]:
        """
            Method for getting group members
        """
        search_filter = f"(&{self.config.group_filter}(dn={self._escape_filter(group_dn)}))"
        results = self.search(self.config.groups_base, search_filter, attributes=['member'], use_cache=use_cache)

        if results and 'member' in results[0]['attributes']:
            members = results[0]['attributes']['member']
            if isinstance(members, list):
                return members
            return [members] if members else []

        return []

    def search_users(
        self,
        search_term: str = None,  # term for search (like uid, cn, mail etc)
        limit: int = 100,
        offset: int = 0,
        use_cache: bool = False
    ) -> List[Dict]:
        """
            Method for user search
        """

        if limit <= 0 or limit > 1000:
            limit = 100

        search_base = self.config.users_base

        if search_term:
            escaped_term = self._escape_filter(search_term)
            search_filter = (
                f"(&{self.config.user_filter}"
                f"(|({self.config.user_id_attr}=*{escaped_term}*)"
                f"({self.config.user_name_attr}=*{escaped_term}*)"
                f"({self.config.user_email_attr}=*{escaped_term}*)))"
            )
        else:
            search_filter = self.config.user_filter

        results = self.search(
            search_base,
            search_filter,
            attributes=[self.config.user_id_attr, self.config.user_name_attr, 
                       self.config.user_email_attr],
            size_limit=limit,
            use_cache=use_cache
        )

        if offset > 0:
            results = results[offset:offset + limit]

        return results[:limit]

    def _escape_filter(self, filter_str: str) -> str:
        """
            Method for escaping special symbols ib filter string
        """

        special_chars = {
            '*': '\\2a', '(': '\\28', ')': '\\29', '\\': '\\5c',
            '\0': '\\00', '/': '\\2f', '&': '\\26', '|': '\\7c',
            '!': '\\21', '=': '\\3d', '>': '\\3e', '<': '\\3c',
            ':': '\\3a', '#': '\\23', '~': '\\7e'
        }
        escaped = []
        for char in filter_str:
            if char in special_chars:
                escaped.append(special_chars[char])
            else:
                escaped.append(char)
        return ''.join(escaped)

    def get_stats(self) -> Dict:
        """
            Method for getting stats
        """

        avg_last_100 = sum(self._query_times) / len(self._query_times) if self._query_times else 0

        return {
            'queries': self._stats['queries'],
            'errors': self._stats['errors'],
            'error_rate': self._stats['errors'] / max(self._stats['queries'], 1),
            'avg_response_time': round(self._stats['avg_response_time'], 3),
            'avg_response_time_last_100': round(avg_last_100, 3),
            'total_time': round(self._stats['total_time'], 2),
            'last_query_time': round(self._stats['last_query_time'], 3) if self._stats['last_query_time'] else None,
            'pool_size': len(self._connection_pool),
            'cache_hits': self._stats['cache_hits'],
            'cache_misses': self._stats['cache_misses'],
            'cache_hit_rate': self._stats['cache_hits'] / max(self._stats['cache_hits'] + self._stats['cache_misses'], 1)
        }

    def test_connection(self) -> bool:
        """
            Method for checking ability to connect to LDAP
        """

        try:
            with self.connection() as conn:
                search_filter = "(objectClass=*)"
                result = conn.search(
                    search_base=self.config.base_dn,
                    search_filter=search_filter,
                    search_scope=SUBTREE,
                    size_limit=1
                )
                return result
        except Exception as e:
            logger.error(f"Connection test failed: {e}")
            return False

    def close(self):
        """
            Method for closing all connections and clearing cache
        """
        with self._pool_lock:
            for conn in self._connection_pool:
                try:
                    if conn.bound:
                        conn.unbind()
                except Exception:
                    pass
            self._connection_pool.clear()

        self._clear_cache()
        logger.info("All LDAP connections closed and cache cleared")

    def __enter__(self):
        """
            Method for context manager support
        """
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
            Method for automatic close after leaving context
        """
        self.close()
