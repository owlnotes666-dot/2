from datetime import date

from supabase import Client

from app.features.ai_assistant.repositories.database.counting import (
    require_exact_count,
)


class AppointmentRepository:
    """Read-only repository for appointment statistics."""

    TABLE_NAME = "appointments"
    SCHEMA_NAME = "medical"

    def __init__(self, client: Client) -> None:
        self.client = client

    def count_appointments(
        self,
        status: str | None = None,
        appointment_date: date | None = None,
    ) -> int:
        query = (
            self.client.schema(self.SCHEMA_NAME)
            .table(self.TABLE_NAME)
            .select("id", count="exact", head=True)
        )

        if status is not None:
            query = query.eq("status", status)

        if appointment_date is not None:
            query = query.eq(
                "appointment_date",
                appointment_date.isoformat(),
            )

        response = query.execute()

        return require_exact_count(response.count)