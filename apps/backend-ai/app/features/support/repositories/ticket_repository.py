from uuid import UUID

from supabase import Client


TICKET_SELECT = """
    id,
    ticket_number,
    subject,
    status,
    priority,
    source,
    created_at,
    updated_at,
    assigned_agent_id,
    customer:customers!tickets_customer_id_fkey(
        id,
        full_name,
        email
    ),
    team:teams!tickets_team_id_fkey(
        id,
        name
    ),
    category:ticket_categories!tickets_category_id_fkey(
        id,
        name
    )
"""


class TicketRepository:
    def __init__(self, client: Client):
        self.client = client

    def list_tickets(
        self,
        *,
        status: str | None = None,
        priority: str | None = None,
        team_id: UUID | None = None,
        assigned_agent_id: UUID | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ):
        query = (
            self.client.schema("support")
            .table("tickets")
            .select(
                """
                id,
                ticket_number,
                subject,
                status,
                priority,
                source,
                created_at,
                updated_at,
                assigned_agent_id,
                customer:customers!tickets_customer_id_fkey(
                    id,
                    full_name,
                    email
                ),
                team:teams!tickets_team_id_fkey(
                    id,
                    name
                )
                """,
                count="exact",
            )
        )

        if status:
            query = query.eq("status", status)

        if priority:
            query = query.eq("priority", priority)

        if team_id:
            query = query.eq("team_id", str(team_id))

        if assigned_agent_id:
            query = query.eq(
                "assigned_agent_id",
                str(assigned_agent_id),
            )

        if search:
            if search.isdigit():
                query = query.eq("ticket_number", int(search))
            else:
                query = query.ilike("subject", f"%{search}%")

        start = (page - 1) * page_size
        end = start + page_size - 1

        return (
            query
            .order("created_at", desc=True)
            .range(start, end)
            .execute()
        )

    def get_ticket(self, ticket_id: UUID):
        response = (
            self.client.schema("support")
            .table("tickets")
            .select(TICKET_SELECT)
            .eq("id", str(ticket_id))
            .limit(1)
            .execute()
        )

        return response.data[0] if response.data else None

    def update_ticket(self, ticket_id: UUID, fields: dict):
        response = (
            self.client.schema("support")
            .table("tickets")
            .update(fields)
            .eq("id", str(ticket_id))
            .select(TICKET_SELECT)
            .execute()
        )

        return response.data[0] if response.data else None

    def assign_ticket_agent(
        self,
        ticket_id: UUID,
        agent_id: UUID | None,
    ) -> None:
        self.client.schema("support").rpc(
            "assign_ticket_agent",
            {
                "p_ticket_id": str(ticket_id),
                "p_agent_id": str(agent_id) if agent_id is not None else None,
            },
        ).execute()

    def category_exists(self, category_id: UUID) -> bool:
        response = (
            self.client.schema("support")
            .table("ticket_categories")
            .select("id")
            .eq("id", str(category_id))
            .limit(1)
            .execute()
        )
        return bool(response.data)

    def is_active_agent(self, agent_id: UUID) -> bool:
        response = (
            self.client.schema("support")
            .table("profiles")
            .select("id")
            .eq("id", str(agent_id))
            .eq("role", "agent")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        return bool(response.data)

    def is_agent_member_of_team(
        self,
        agent_id: UUID,
        team_id: UUID,
    ) -> bool:
        response = (
            self.client.schema("support")
            .table("team_members")
            .select("profile_id")
            .eq("profile_id", str(agent_id))
            .eq("team_id", str(team_id))
            .limit(1)
            .execute()
        )
        return bool(response.data)

    def get_conversation(self, ticket_id: UUID):
        response = (
            self.client.schema("support")
            .table("conversations")
            .select("id")
            .eq("ticket_id", str(ticket_id))
            .limit(1)
            .execute()
        )

        return response.data[0] if response.data else None

    def list_messages(self, conversation_id: UUID):
        response = (
            self.client.schema("support")
            .table("messages")
            .select(
                """
                id,
                sender_type,
                sender_profile_id,
                customer_id,
                content,
                is_internal,
                created_at
                """
            )
            .eq("conversation_id", str(conversation_id))
            .order("created_at", desc=False)
            .execute()
        )

        return response.data

    def list_assignment_history(self, ticket_id: UUID):
        response = (
            self.client.schema("support")
            .table("ticket_assignments")
            .select(
                """
                id,
                from_team_id,
                to_team_id,
                from_agent_id,
                to_agent_id,
                changed_by,
                reason,
                created_at,
                from_team:teams!ticket_assignments_from_team_id_fkey(
                    id,
                    name
                ),
                to_team:teams!ticket_assignments_to_team_id_fkey(
                    id,
                    name
                )
                """
            )
            .eq("ticket_id", str(ticket_id))
            .order("created_at", desc=False)
            .execute()
        )

        return response.data
