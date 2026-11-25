from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.dependencies.support_auth import (
    SupportUser,
    get_current_support_user,
)
from app.features.support.schemas.auth import SupportProfileResponse
from app.features.support.schemas.ticket import TicketListResponse
from app.features.support.services.ticket_service import (
    list_support_tickets,
)


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


@router.get(
    "/tickets",
    response_model=TicketListResponse,
)
def get_support_tickets(
    current_user: SupportUser = Depends(get_current_support_user),
    status_filter: Annotated[
        str | None,
        Query(alias="status"),
    ] = None,
    priority: str | None = None,
    team_id: UUID | None = None,
    assigned_agent_id: UUID | None = None,
    search: Annotated[
        str | None,
        Query(min_length=1, max_length=100),
    ] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return list_support_tickets(
        current_user,
        status_filter=status_filter,
        priority=priority,
        team_id=team_id,
        assigned_agent_id=assigned_agent_id,
        search=search,
        page=page,
        page_size=page_size,
    )