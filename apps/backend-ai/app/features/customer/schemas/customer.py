from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


CustomerTicketStatus = Literal[
    "open",
    "in_progress",
    "pending",
    "resolved",
    "closed",
]

CustomerTicketPriority = Literal[
    "low",
    "normal",
    "high",
    "urgent",
]


class CustomerProfileResponse(BaseModel):
    id: UUID
    full_name: str
    email: str


class CustomerTicketCreateRequest(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class CustomerMessageCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=5000)


class CustomerMessageResponse(BaseModel):
    id: UUID
    sender_type: Literal["customer", "agent", "system"]
    content: str
    created_at: datetime


class CustomerTicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ticket_number: int
    subject: str
    status: CustomerTicketStatus
    priority: CustomerTicketPriority
    created_at: datetime
    updated_at: datetime


class CustomerTicketListResponse(BaseModel):
    items: list[CustomerTicketResponse]
    total: int
    page: int
    page_size: int


class CustomerTicketDetailsResponse(CustomerTicketResponse):
    messages: list[CustomerMessageResponse]


class CustomerTicketCreatedResponse(BaseModel):
    ticket_id: UUID
    ticket_number: int
    conversation_id: UUID
    message_id: UUID
    message: str = "Ticket created successfully."