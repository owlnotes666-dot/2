from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status

from app.core.dependencies.customer_auth import (
    CustomerUser,
    get_current_customer,
)

from app.core.rate_limit import limiter

from app.features.customer.schemas.customer import (
    CustomerMessageCreateRequest,
    CustomerMessageResponse,
    CustomerProfileResponse,
    CustomerTicketCreateRequest,
    CustomerTicketCreatedResponse,
    CustomerTicketDetailsResponse,
    CustomerTicketListResponse,
)

from app.features.customer.services.customer_service import (
    create_customer_ticket,
    get_customer_profile,
    get_customer_ticket_details,
    list_customer_tickets,
    send_customer_message,
)


router = APIRouter(
    prefix="/customer",
    tags=["Customer"],
)


@router.get(
    "/me",
    response_model=CustomerProfileResponse,
)
def get_profile(
    current_user: CustomerUser = Depends(get_current_customer),
):
    return get_customer_profile(current_user)


@router.get(
    "/tickets",
    response_model=CustomerTicketListResponse,
)
def get_tickets(
    current_user: CustomerUser = Depends(get_current_customer),
    status_filter: Annotated[
        str | None,
        Query(alias="status"),
    ] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return list_customer_tickets(
        current_user,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
    )


@router.get(
    "/tickets/{ticket_id}",
    response_model=CustomerTicketDetailsResponse,
)
def get_ticket(
    ticket_id: UUID,
    current_user: CustomerUser = Depends(get_current_customer),
):
    return get_customer_ticket_details(
        current_user,
        ticket_id,
    )


@router.post(
    "/tickets",
    response_model=CustomerTicketCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
def create_ticket(
    request: Request,
    payload: CustomerTicketCreateRequest,
    current_user: CustomerUser = Depends(get_current_customer),
):
    return create_customer_ticket(
        current_user,
        subject=payload.subject,
        message=payload.message,
    )


@router.post(
    "/tickets/{ticket_id}/messages",
    response_model=CustomerMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
def send_message(
    request: Request,
    ticket_id: UUID,
    payload: CustomerMessageCreateRequest,
    current_user: CustomerUser = Depends(get_current_customer),
):
    return send_customer_message(
        current_user,
        ticket_id,
        content=payload.content,
    )