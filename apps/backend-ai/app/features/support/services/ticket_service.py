import logging
from uuid import UUID

from fastapi import HTTPException, status

from app.core.supabase import get_supabase_user_client
from app.core.dependencies.support_auth import SupportUser
from app.features.support.repositories.ticket_repository import (
    TicketRepository,
)
from app.features.support.schemas.ticket import (
    TicketListResponse,
    TicketResponse,
)


logger = logging.getLogger(__name__)


def list_support_tickets(
    current_user: SupportUser,
    *,
    status_filter: str | None = None,
    priority: str | None = None,
    team_id: UUID | None = None,
    assigned_agent_id: UUID | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> TicketListResponse:
    try:
        supabase = get_supabase_user_client(
            current_user.access_token.get_secret_value()
        )

        repository = TicketRepository(supabase)

        response = repository.list_tickets(
            status=status_filter,
            priority=priority,
            team_id=team_id,
            assigned_agent_id=assigned_agent_id,
            search=search,
            page=page,
            page_size=page_size,
        )

        items = [
            TicketResponse.model_validate(ticket)
            for ticket in response.data
        ]

        return TicketListResponse(
            items=items,
            total=response.count or 0,
            page=page,
            page_size=page_size,
        )

    except Exception:
        logger.exception("Failed to retrieve Support tickets.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve tickets at this time.",
        ) from None
