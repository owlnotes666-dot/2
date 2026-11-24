from supabase import Client

from app.features.ai_assistant.repositories.database.counting import (
    require_exact_count,
)


class DoctorRepository:
    """Read-only repository for doctor statistics."""

    TABLE_NAME = "doctors"
    SCHEMA_NAME = "medical"

    def __init__(self, client: Client) -> None:
        self.client = client

    def count_by_specialty(
        self,
        specialty: str | None = None,
        status: str | None = None,
    ) -> int:
        query = (
            self.client.schema(self.SCHEMA_NAME)
            .table(self.TABLE_NAME)
            .select("id", count="exact", head=True)
        )

        if specialty is not None:
            query = query.eq("specialty", specialty)

        if status is not None:
            query = query.eq("status", status)

        response = query.execute()

        return require_exact_count(response.count)
