from fastapi import APIRouter, Depends

from app.core.dependencies.support_auth import (
    SupportUser,
    get_current_support_user,
)
from app.features.support.schemas.auth import SupportProfileResponse


router = APIRouter(
    prefix="/support",
    tags=["Support"],
)


@router.get(
    "/me",
    response_model=SupportProfileResponse,
)
def get_support_profile(
    current_user: SupportUser = Depends(get_current_support_user),
):
    return SupportProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
    )