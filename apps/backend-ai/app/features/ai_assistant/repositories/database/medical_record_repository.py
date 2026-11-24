from supabase import Client

from app.features.ai_assistant.repositories.database.counting import (
    require_exact_count,
)


class MedicalRecordRepository:
    """Read-only repository for medical record statistics."""

    TABLE_NAME = "medical_records"
    SCHEMA_NAME = "medical"

    def __init__(self, client: Client) -> None:
        self.client = client

    def count_records(self, status: str | None = None) -> int:
        query = (
            self.client.schema(self.SCHEMA_NAME)
            .table(self.TABLE_NAME)
            .select("id", count="exact", head=True)
        )

        if status is not None:
            query = query.eq("status", status)

        response = query.execute()

        return require_exact_count(response.count)