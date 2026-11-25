from uuid import UUID

from supabase import Client


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

        response = (
            query
            .order("created_at", desc=True)
            .range(start, end)
            .execute()
        )

        return response