from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SupportProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str | None = None
    full_name: str | None = None
    role: Literal["admin", "agent"]
    is_active: bool