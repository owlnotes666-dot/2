from uuid import UUID

from supabase import Client


class CustomerRepository:
    def __init__(self, client: Client):
        self.client = client

    def get_profile(self, customer_id: UUID):
        response = (
            self.client.schema("support")
            .table("customers")
            .select("id, full_name, email")
            .eq("id", str(customer_id))
            .limit(1)
            .execute()
        )

        return response.data[0] if response.data else None

    def list_tickets(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        status: str | None = None,
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
                created_at,
                updated_at
                """,
                count="exact",
            )
        )

        if status:
            query = query.eq("status", status)

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
            .select(
                """
                id,
                ticket_number,
                subject,
                status,
                priority,
                created_at,
                updated_at
                """
            )
            .eq("id", str(ticket_id))
            .limit(1)
            .execute()
        )

        return response.data[0] if response.data else None

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
                content,
                is_internal,
                created_at
                """
            )
            .eq("conversation_id", str(conversation_id))
            .eq("is_internal", False)
            .order("created_at", desc=False)
            .execute()
        )

        return response.data

    def create_ticket(
        self,
        *,
        subject: str,
        message: str,
    ):
        return (
            self.client.schema("support")
            .rpc(
                "create_customer_ticket",
                {
                    "p_subject": subject,
                    "p_message": message,
                },
            )
            .execute()
        )

    def create_message(
        self,
        *,
        conversation_id: UUID,
        customer_id: UUID,
        content: str,
    ):
        return (
            self.client.schema("support")
            .table("messages")
            .insert(
                {
                    "conversation_id": str(conversation_id),
                    "sender_type": "customer",
                    "customer_id": str(customer_id),
                    "sender_profile_id": None,
                    "content": content,
                    "is_internal": False,
                }
            )
            .execute()
        )
