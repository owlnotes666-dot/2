from typing import Any
from uuid import UUID

from supabase import Client


class ConversationRepository:
    """Handles persistent admin conversations and their messages."""

    def __init__(self, client: Client):
        self.client = client

    def create_conversation(
        self,
        owner_id: UUID,
        title: str = "New conversation",
        conversation_id: UUID | None = None,
    ) -> dict[str, Any]:
        conversation_data = {
            "owner_id": str(owner_id),
            "title": title[:100],
        }

        if conversation_id is not None:
            conversation_data["id"] = str(conversation_id)

        response = (
            self.client.schema("medical")
            .table("conversations")
            .insert(conversation_data)
            .execute()
        )

        if not response.data:
            raise RuntimeError("Failed to create conversation.")

        return response.data[0]

    def get_conversation(
        self,
        conversation_id: UUID,
    ) -> dict[str, Any] | None:
        response = (
            self.client.schema("medical")
            .table("conversations")
            .select("*")
            .eq("id", str(conversation_id))
            .limit(1)
            .execute()
        )

        return response.data[0] if response.data else None

    def list_conversations(
        self,
        owner_id: UUID,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        response = (
            self.client.schema("medical")
            .table("conversations")
            .select("*")
            .eq("owner_id", str(owner_id))
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )

        return response.data or []

    def get_messages(
        self,
        conversation_id: UUID,
    ) -> list[dict[str, Any]]:
        response = (
            self.client.schema("medical")
            .table("conversation_messages")
            .select("*")
            .eq("conversation_id", str(conversation_id))
            .order("created_at", desc=False)
            .execute()
        )

        return response.data or []

    def save_message(
        self,
        conversation_id: UUID,
        role: str,
        content: str,
        sources: list[dict[str, Any]] | None = None,
        web_sources: list[dict[str, Any]] | None = None,
        usage: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        response = (
            self.client.schema("medical")
            .table("conversation_messages")
            .insert({
                "conversation_id": str(conversation_id),
                "role": role,
                "content": content,
                "sources": sources or [],
                "web_sources": web_sources or [],
                "usage": usage,
            })
            .execute()
        )

        if not response.data:
            raise RuntimeError("Failed to save conversation message.")

        return response.data[0]

    def update_conversation(
        self,
        conversation_id: UUID,
        **updates: Any,
    ) -> None:
        if not updates:
            return

        (
            self.client.schema("medical")
            .table("conversations")
            .update(updates)
            .eq("id", str(conversation_id))
            .execute()
        )

    def delete_conversation(
        self,
        conversation_id: UUID,
        owner_id: UUID,
    ) -> bool:
        response = (
            self.client.schema("medical")
            .table("conversations")
            .delete()
            .eq("id", str(conversation_id))
            .eq("owner_id", str(owner_id))
            .execute()
        )

        return bool(response.data)
