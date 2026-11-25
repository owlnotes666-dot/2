from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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


class TicketCustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str


class TicketTeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


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
    assigned_agent_id: UUID | None = None


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int
    page: int
    page_size: int