from dataclasses import dataclass

from app.models import SpaceModel


@dataclass
class SpaceCacheKey:
    user_id: str
    token: str
    url: str

    def __hash__(self):
        return hash((self.user_id, self.token, self.url))

def key_for_space(space: SpaceModel) -> SpaceCacheKey:
    return SpaceCacheKey(space.user_id, space.token, str(space.url))
