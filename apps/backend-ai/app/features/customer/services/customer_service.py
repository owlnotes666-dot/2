import logging
from uuid import UUID

from fastapi import HTTPException, status

from app.core.dependencies.customer_auth import CustomerUser
from app.core.supabase import get_supabase_user_client

from app.features.customer.repositories.customer_repository import (
    CustomerRepository,
)

from app.features.customer.schemas.customer import (
    CustomerProfileResponse,
    CustomerTicketCreatedResponse,
    CustomerTicketDetailsResponse,
    CustomerTicketListResponse,
    CustomerTicketResponse,
)


logger = logging.getLogger(__name__)


def _get_repository(current_user: CustomerUser):
    if current_user.access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    supabase = get_supabase_user_client(
        current_user.access_token.get_secret_value()
    )

    return CustomerRepository(supabase)


def _validate_text(value: str, *, field: str, minimum: int, maximum: int) -> str:
    normalized = value.strip()

    if not minimum <= len(normalized) <= maximum:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field} must contain between {minimum} and {maximum} non-whitespace characters.",
        )

    return normalized


def get_customer_profile(
    current_user: CustomerUser,
) -> CustomerProfileResponse:
    try:
        repository = _get_repository(current_user)

        profile = repository.get_profile(
            current_user.customer_id
        )

        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer profile not found.",
            )

        return CustomerProfileResponse(**profile)

    except HTTPException:
        raise

    except Exception:
        logger.exception("Failed to retrieve customer profile.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve customer profile.",
        ) from None


def list_customer_tickets(
    current_user: CustomerUser,
    *,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
) -> CustomerTicketListResponse:
    try:
        repository = _get_repository(current_user)

        response = repository.list_tickets(
            customer_id=current_user.customer_id,
            page=page,
            page_size=page_size,
            status=status_filter,
        )

        items = [
            CustomerTicketResponse(**ticket)
            for ticket in response.data
        ]

        return CustomerTicketListResponse(
            items=items,
            total=response.count or 0,
            page=page,
            page_size=page_size,
        )

    except Exception:
        logger.exception("Failed to retrieve customer tickets.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve tickets.",
        ) from None


def get_customer_ticket_details(
    current_user: CustomerUser,
    ticket_id: UUID,
) -> CustomerTicketDetailsResponse:
    try:
        repository = _get_repository(current_user)

        ticket = repository.get_ticket(
            ticket_id,
            customer_id=current_user.customer_id,
        )

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

        return CustomerTicketDetailsResponse(
            **ticket,
            messages=messages,
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception("Failed to retrieve customer ticket details.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve ticket details.",
        ) from None


def create_customer_ticket(
    current_user: CustomerUser,
    *,
    subject: str,
    message: str,
) -> CustomerTicketCreatedResponse:
    normalized_subject = _validate_text(
        subject,
        field="Subject",
        minimum=3,
        maximum=200,
    )
    normalized_message = _validate_text(
        message,
        field="Message",
        minimum=1,
        maximum=5000,
    )

    try:
        repository = _get_repository(current_user)

        response = repository.create_ticket(
            subject=normalized_subject,
            message=normalized_message,
        )

        if not response.data:
            raise RuntimeError("Ticket creation returned no data.")

        result = response.data[0]

        return CustomerTicketCreatedResponse(
            ticket_id=result["ticket_id"],
            ticket_number=result["ticket_number"],
            conversation_id=result["conversation_id"],
            message_id=result["message_id"],
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception("Failed to create customer ticket.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create ticket at this time.",
        ) from None


def send_customer_message(
    current_user: CustomerUser,
    ticket_id: UUID,
    *,
    content: str,
):
    normalized_content = _validate_text(
        content,
        field="Message",
        minimum=1,
        maximum=5000,
    )

    try:
        repository = _get_repository(current_user)

        ticket = repository.get_ticket(
            ticket_id,
            customer_id=current_user.customer_id,
        )

        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found.",
            )

        conversation = repository.get_conversation(ticket_id)

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )

        response = repository.create_message(
            conversation_id=UUID(conversation["id"]),
            customer_id=current_user.customer_id,
            content=normalized_content,
        )

        if not response.data:
            raise RuntimeError("Message creation returned no data.")

        message = response.data[0]

        return {
            "id": message["id"],
            "sender_type": message["sender_type"],
            "content": message["content"],
            "created_at": message["created_at"],
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Failed to send customer message.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send message at this time.",
        ) from None
