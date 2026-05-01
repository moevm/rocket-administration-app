from fastapi import APIRouter, Depends, HTTPException
from app.features.spaces.utils import get_space
from app.lib.rocket import obtain_rocket_instance
from app.lib.cache import key_for_space
from app.services.ldap_sync_service import LDAPConfig, LDAPSyncService
from app.config import ldap_settings
from app.features.ldap.models import LDAPConfigRequest, LDAPConfigResponse, SyncResponse

router = APIRouter()

class LDAPConfigManager:
    def __init__(self):
        self._config = None
    
    def get_or_create_config(self):
        if self._config is None:
            self._config = LDAPConfig(
                host=getattr(ldap_settings, 'host', 'localhost'),
                port=getattr(ldap_settings, 'port', 389),
                bind_dn=getattr(ldap_settings, 'bind_dn', ''),
                bind_password=getattr(ldap_settings, 'bind_password', ''),
                base_dn=getattr(ldap_settings, 'base_dn', ''),
                group_role_mapping={},
                group_channel_mapping={},
            )
        return self._config
    
    def update_config(self, new_config: LDAPConfig):
        self._config = new_config

config_manager = LDAPConfigManager()

def get_config_manager() -> LDAPConfigManager:
    return config_manager

async def get_sync_service(
    space=Depends(get_space),
    config_mgr: LDAPConfigManager = Depends(get_config_manager)
):
    config = config_mgr.get_or_create_config()
    cache_key = key_for_space(space)
    rocket = await obtain_rocket_instance(cache_key)
    return LDAPSyncService(config, rocket)

@router.post("/sync")
async def sync_ldap(service: LDAPSyncService = Depends(get_sync_service)) -> SyncResponse:
    try:
        stats = await service.sync_all_users()
        return SyncResponse(message="Synchronization completed", stats=stats)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/status") 
async def sync_status(service: LDAPSyncService = Depends(get_sync_service)):
    try:
        result = await service.test_connection()
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/config")
async def get_config(
    config_mgr: LDAPConfigManager = Depends(get_config_manager)
) -> LDAPConfigResponse:
    config = config_mgr.get_or_create_config()
    return LDAPConfigResponse(
        host=config.host,
        port=config.port,
        use_ssl=config.use_ssl,
        bind_dn=config.bind_dn,
        base_dn=config.base_dn,
        user_base_dn=config.user_base_dn,
        group_base_dn=config.group_base_dn,
        user_filter=config.user_filter,
        group_filter=config.group_filter,
        username_attr=config.username_attr,
        email_attr=config.email_attr,
        name_attr=config.name_attr,
        first_name_attr=config.first_name_attr,
        last_name_attr=config.last_name_attr,
        member_of_attr=config.member_of_attr,
        group_role_mapping=config.group_role_mapping,
        group_channel_mapping=config.group_channel_mapping,
        deactivate_missing=config.deactivate_missing,
        delete_missing=config.delete_missing,
        default_password_length=config.default_password_length,
        join_default_channels=config.join_default_channels
    )

@router.put("/config")
async def update_config(
    request: LDAPConfigRequest,
    config_mgr: LDAPConfigManager = Depends(get_config_manager)
) -> LDAPConfigResponse:
    new_config = LDAPConfig(
        host=request.host,
        port=request.port,
        use_ssl=request.use_ssl,
        bind_dn=request.bind_dn,
        bind_password=request.bind_password,
        base_dn=request.base_dn,
        user_base_dn=request.user_base_dn,
        group_base_dn=request.group_base_dn,
        user_filter=request.user_filter,
        group_filter=request.group_filter,
        username_attr=request.username_attr,
        email_attr=request.email_attr,
        name_attr=request.name_attr,
        first_name_attr=request.first_name_attr,
        last_name_attr=request.last_name_attr,
        member_of_attr=request.member_of_attr,
        group_role_mapping=request.group_role_mapping,
        group_channel_mapping=request.group_channel_mapping,
        deactivate_missing=request.deactivate_missing,
        delete_missing=request.delete_missing,
        default_password_length=request.default_password_length,
        join_default_channels=request.join_default_channels
    )
    
    config_mgr.update_config(new_config)
    
    return LDAPConfigResponse(
        host=new_config.host,
        port=new_config.port,
        use_ssl=new_config.use_ssl,
        bind_dn=new_config.bind_dn,
        base_dn=new_config.base_dn,
        user_base_dn=new_config.user_base_dn,
        group_base_dn=new_config.group_base_dn,
        user_filter=new_config.user_filter,
        group_filter=new_config.group_filter,
        username_attr=new_config.username_attr,
        email_attr=new_config.email_attr,
        name_attr=new_config.name_attr,
        first_name_attr=new_config.first_name_attr,
        last_name_attr=new_config.last_name_attr,
        member_of_attr=new_config.member_of_attr,
        group_role_mapping=new_config.group_role_mapping,
        group_channel_mapping=new_config.group_channel_mapping,
        deactivate_missing=new_config.deactivate_missing,
        delete_missing=new_config.delete_missing,
        default_password_length=new_config.default_password_length,
        join_default_channels=new_config.join_default_channels
    )