import logging
from uuid import UUID

from fastapi import HTTPException, status

from app.core.supabase import get_supabase_user_client
from app.core.dependencies.support_auth import SupportUser

from app.features.support.repositories.ticket_repository import (
    TicketRepository,
)

from app.features.support.schemas.ticket import (
    TicketDetailsResponse,
    TicketListResponse,
    TicketResponse,
    TicketUpdateRequest,
)


logger = logging.getLogger(__name__)


def _get_repository(current_user: SupportUser):
    supabase = get_supabase_user_client(
        current_user.access_token.get_secret_value()
    )

    return TicketRepository(supabase)


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
        repository = _get_repository(current_user)

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


def get_support_ticket_details(
    current_user: SupportUser,
    ticket_id: UUID,
) -> TicketDetailsResponse:
    try:
        repository = _get_repository(current_user)

        ticket = repository.get_ticket(ticket_id)

        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found.",
            )

        conversation = repository.get_conversation(ticket_id)

        messages = []

        if conversation:
            messages = repository.list_messages(
                UUID(conversation["id"])
            )

        assignment_history = (
            repository.list_assignment_history(ticket_id)
        )

        return TicketDetailsResponse(
            **ticket,
            messages=messages,
            assignment_history=assignment_history,
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Failed to retrieve Support ticket details."
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve ticket details at this time.",
        ) from None


def update_support_ticket(
    current_user: SupportUser,
    ticket_id: UUID,
    payload: TicketUpdateRequest,
) -> TicketResponse:
    try:
        repository = _get_repository(current_user)
        current_ticket = repository.get_ticket(ticket_id)

        if current_ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found.",
            )

        fields = payload.model_dump(exclude_unset=True)

        # PostgREST's JSON payload must contain serializable scalar values.
        # Pydantic keeps UUID instances in model_dump(), so normalize them
        # before passing the update dictionary to the Supabase client.
        fields = {
            key: str(value) if isinstance(value, UUID) else value
            for key, value in fields.items()
        }

        category_id = fields.get("category_id")
        if category_id is not None and not repository.category_exists(
            category_id
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid ticket category.",
            )

        agent_id = fields.get("assigned_agent_id")
        if agent_id is not None:
            team = current_ticket.get("team") or {}
            team_id = team.get("id")

            if not team_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ticket must belong to a team before agent assignment.",
                )

            if not repository.is_active_agent(agent_id):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Assigned user must be an active support agent.",
                )

            if not repository.is_agent_member_of_team(
                agent_id,
                UUID(team_id),
            ):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Agent must be a member of the ticket's team.",
                )

        updated = repository.update_ticket(ticket_id, fields)

        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or you do not have permission to update it.",
            )

        return TicketResponse.model_validate(updated)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Failed to update Support ticket.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to update ticket at this time.",
        ) from None
