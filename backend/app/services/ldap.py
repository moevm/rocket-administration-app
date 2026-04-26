import logging
import threading
from typing import List, Dict, Optional, Any

from app.config import ldap_settings
from app.lib.ldap_client import LDAPClient

logger = logging.getLogger(__name__)


class LDAPService:
    """
        This service wraps LDAPClient functionality and adds business logic for common
        operations like retrieving group members, user groups, and searching. It manages
        the client lifecycle and provides a simplified interface for the application.
    """
    def __init__(self):
        """
            Method for LDAP service initialization
        """

        self.settings = ldap_settings
        self._client: Optional[LDAPClient] = None

    @property
    def client(self) -> LDAPClient:
        """
            Method for getting or create the LDAP client instance.
        """

        if self._client is None:
            self._client = LDAPClient(self.settings)
        return self._client

    def test_connection(self) -> bool:
        """
            Method for testing connection
        """
        try:
            return self.client.test_connection()
        except Exception as e:
            logger.error(f"LDAP connection test failed: {e}")
            return False

    def get_group_members(self, group_name: str) -> List[Dict[str, Any]]:
        """
            Method for retrieving all members of a specified LDAP group
        """

        search_filter = f"(&{self.settings.group_filter}(cn={group_name}))"
        groups = self.client.search(
            self.settings.groups_base,
            search_filter,
            attributes=['member']
        )

        if not groups:
            logger.warning(f"Group '{group_name}' not found")
            return []

        members_dn = groups[0]['attributes'].get('member', [])
        if isinstance(members_dn, str):
            members_dn = [members_dn]

        users = []
        for dn in members_dn:
            uid = self._extract_uid_from_dn(dn)
            if uid:
                user = self.client.get_user_by_id(uid)
                if user:
                    users.append(user)

        return users

    def get_user_groups(self, username: str) -> List[str]:
        """
            Method for getting all LDAP groups that a user belongs to
        """
        return self.client.get_user_groups(username)

    def get_all_groups(self) -> List[Dict[str, Any]]:
        """
            Method for retrieving all LDAP groups from the directory
        """
        return self.client.get_all_groups()

    def get_users_by_group_dn(self, group_dn: str) -> List[Dict[str, Any]]:
        """
            Method for retrieving all users belonging to a group using its Distinguished Name
        """
        return self.client.get_users_by_group(group_dn)

    def search_ldap_users(
        self,
        search_term: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
            Method for searching for users by partial matches on common attributes
        """
        return self.client.search_users(search_term, limit, offset)

    def _extract_uid_from_dn(self, dn: str) -> Optional[str]:
        """
            Method for extracting the UID (username) from a Distinguished Name string
        """
        for part in dn.split(','):
            if part.strip().startswith('uid='):
                return part.strip()[4:]
        return None

    def get_ldap_stats(self) -> Dict[str, Any]:
        """
            Method for getting performance statistics for LDAP operations
        """
        return self.client.get_stats()

    def close(self):
        """
            Method for closing all LDAP connections and release resources
        """
        if self._client:
            self._client.close()
            self._client = None


_ldap_service: Optional[LDAPService] = None
_ldap_service_lock = threading.Lock()


def get_ldap_service() -> LDAPService:
    """
        Method for getting the global singleton instance of LDAPService
    """
    global _ldap_service

    if _ldap_service is None:
        with _ldap_service_lock:
            if _ldap_service is None:
                _ldap_service = LDAPService()
    
    return _ldap_service


def close_ldap_service():
    """
        Method for closing the global LDAP service and cleaning up resources
    """
    global _ldap_service
    with _ldap_service_lock:
        if _ldap_service:
            _ldap_service.close()
            _ldap_service = None
