from typing import Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class LDAPConfigRequest(BaseModel):
    host: str
    port: int
    use_ssl: bool = False
    bind_dn: str
    bind_password: str
    base_dn: str
    user_base_dn: str
    group_base_dn: str
    user_filter: str = "(objectClass=inetOrgPerson)"
    group_filter: str = "(objectClass=groupOfNames)"
    username_attr: str = "uid"
    email_attr: str = "mail"
    name_attr: str = "cn"
    first_name_attr: str = "givenName"
    last_name_attr: str = "sn"
    member_of_attr: str = "memberOf"
    group_role_mapping: Dict[str, str] = Field(default_factory=dict)
    group_channel_mapping: Dict[str, str] = Field(default_factory=dict)
    deactivate_missing: bool = False
    delete_missing: bool = False
    default_password_length: int = 16
    join_default_channels: bool = False


class LDAPConfigResponse(BaseModel):
    host: str
    port: int
    use_ssl: bool
    bind_dn: str
    base_dn: str
    user_base_dn: str
    group_base_dn: str
    user_filter: str
    group_filter: str
    username_attr: str
    email_attr: str
    name_attr: str
    first_name_attr: str
    last_name_attr: str
    member_of_attr: str
    group_role_mapping: Dict[str, str]
    group_channel_mapping: Dict[str, str]
    deactivate_missing: bool
    delete_missing: bool
    default_password_length: int
    join_default_channels: bool


class SyncResponse(BaseModel):
    message: str
    stats: Optional[Dict] = None