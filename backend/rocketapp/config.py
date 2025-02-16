from dynaconf import Dynaconf

settings = Dynaconf(
    envvar_prefix="ROCKETAPP",
    settings_files=['settings.yaml', 'secrets.yaml']
)
