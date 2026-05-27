from dynaconf import Dynaconf
from .ldap import LDAPSettings

settings = Dynaconf(
    envvar_prefix="ROCKETAPP",
    settings_files=['settings.yaml', '.secrets.yaml'],
    environments=True
)

ldap_settings = LDAPSettings(**settings.get('ldap', {}))

__all__ = ['settings', 'ldap_settings', 'LDAPSettings']
