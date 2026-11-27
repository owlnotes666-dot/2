from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


TicketStatus = Literal[
    "open",
    "in_progress",
    "pending",
    "resolved",
    "closed",
]

TicketPriority = Literal[
    "low",
    "normal",
    "high",
    "urgent",
]

MessageSenderType = Literal[
    "customer",
    "agent",
    "system",
]


class TicketUpdateRequest(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    category_id: UUID | None = None
    assigned_agent_id: UUID | None = None

    @model_validator(mode="after")
    def validate_update_fields(self):
        if not self.model_fields_set:
            raise ValueError("At least one ticket field must be provided.")
        return self


class TicketCustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str


class TicketTeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class TicketCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class TicketMessageResponse(BaseModel):
    id: UUID
    sender_type: MessageSenderType
    sender_profile_id: UUID | None = None
    customer_id: UUID | None = None
    content: str
    is_internal: bool
    created_at: datetime


class TicketAssignmentResponse(BaseModel):
    id: UUID
    from_team_id: UUID | None = None
    to_team_id: UUID
    from_agent_id: UUID | None = None
    to_agent_id: UUID | None = None
    changed_by: UUID | None = None
    reason: str | None = None
    created_at: datetime

    from_team: TicketTeamResponse | None = None
    to_team: TicketTeamResponse | None = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ticket_number: int
    subject: str
    status: TicketStatus
    priority: TicketPriority
    source: str
    created_at: datetime
    updated_at: datetime

    customer: TicketCustomerResponse
    team: TicketTeamResponse | None = None
    category: TicketCategoryResponse | None = None
    assigned_agent_id: UUID | None = None


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int
    page: int
    page_size: int


class TicketDetailsResponse(TicketResponse):
    messages: list[TicketMessageResponse]
    assignment_history: list[TicketAssignmentResponse]
