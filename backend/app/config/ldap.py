from pydantic import Field, BaseModel

class LDAPSettings(BaseModel):
    """LDAP configuration settings"""

    host: str
    port: int
    use_ssl: bool
    bind_dn: str
    bind_password: str
    base_dn: str
    users_base: str
    groups_base: str
    user_filter: str = Field(default="(objectClass=inetOrgPerson)")
    group_filter: str = Field(default="(objectClass=groupOfNames)")
    user_id_attr: str = Field(default="uid")
    user_name_attr: str = Field(default="cn")
    user_email_attr: str = Field(default="mail")
    connection_timeout: int = Field(default=10)

    class Config:
        extra = "ignore"
