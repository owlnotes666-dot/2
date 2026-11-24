from unittest.mock import MagicMock

import pytest

from app.features.ai_assistant.repositories.database.doctor_repository import (
    DoctorRepository,
)


def create_repository(count: int | None):
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.table.return_value.select.return_value = query
    query.eq.return_value = query

    response = MagicMock()
    response.count = count
    query.execute.return_value = response

    return DoctorRepository(client), query


def test_count_all_doctors():
    repository, query = create_repository(20)

    result = repository.count_by_specialty()

    assert result == 20
    query.eq.assert_not_called()


def test_count_doctors_by_specialty():
    repository, query = create_repository(8)

    result = repository.count_by_specialty(specialty="Cardiology")

    assert result == 8
    query.eq.assert_called_once_with("specialty", "Cardiology")


def test_count_doctors_by_status():
    repository, query = create_repository(15)

    result = repository.count_by_specialty(status="Active")

    assert result == 15
    query.eq.assert_called_once_with("status", "Active")


def test_count_doctors_by_specialty_and_status():
    repository, query = create_repository(5)

    result = repository.count_by_specialty(
        specialty="Cardiology",
        status="Active",
    )

    assert result == 5
    assert query.eq.call_count == 2
    query.eq.assert_any_call("specialty", "Cardiology")
    query.eq.assert_any_call("status", "Active")


def test_count_doctors_rejects_missing_exact_count():
    repository, _ = create_repository(None)

    with pytest.raises(RuntimeError, match="exact row count"):
        repository.count_by_specialty()