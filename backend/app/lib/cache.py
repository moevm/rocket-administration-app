from dataclasses import dataclass

from app.models import SpaceModel


@dataclass
class SpaceCacheKey:
    login: str
    password: str
    url: str

    def __hash__(self):
        return hash((self.login, self.password, self.url))

def key_for_space(space: SpaceModel) -> SpaceCacheKey:
    return SpaceCacheKey(space.login, space.password, str(space.url))
