from datetime import date
from unittest.mock import MagicMock

import pytest

from app.features.ai_assistant.repositories.database.appointment_repository import (
    AppointmentRepository,
)


def create_repository(count: int | None):
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.table.return_value.select.return_value = query
    query.eq.return_value = query

    response = MagicMock()
    response.count = count
    query.execute.return_value = response

    return AppointmentRepository(client), query


def test_count_all_appointments():
    repository, query = create_repository(30)

    result = repository.count_appointments()

    assert result == 30
    query.eq.assert_not_called()


def test_count_appointments_by_status():
    repository, query = create_repository(10)

    result = repository.count_appointments(status="Scheduled")

    assert result == 10
    query.eq.assert_called_once_with("status", "Scheduled")


def test_count_appointments_by_date():
    repository, query = create_repository(7)
    appointment_date = date(2026, 11, 13)

    result = repository.count_appointments(
        appointment_date=appointment_date
    )

    assert result == 7
    query.eq.assert_called_once_with(
        "appointment_date",
        "2026-11-13",
    )


def test_count_appointments_by_status_and_date():
    repository, query = create_repository(4)
    appointment_date = date(2026, 11, 13)

    result = repository.count_appointments(
        status="Scheduled",
        appointment_date=appointment_date,
    )

    assert result == 4
    assert query.eq.call_count == 2
    query.eq.assert_any_call("status", "Scheduled")
    query.eq.assert_any_call("appointment_date", "2026-11-13")


def test_count_appointments_rejects_missing_exact_count():
    repository, _ = create_repository(None)

    with pytest.raises(RuntimeError, match="exact row count"):
        repository.count_appointments()