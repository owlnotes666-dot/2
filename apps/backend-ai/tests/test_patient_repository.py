from unittest.mock import MagicMock

import pytest

from app.features.ai_assistant.repositories.database.patient_repository import (
    PatientRepository,
)


def create_repository(count: int | None):
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.table.return_value.select.return_value = query
    query.eq.return_value = query

    response = MagicMock()
    response.count = count
    query.execute.return_value = response

    return PatientRepository(client), client, query


def test_count_all_patients():
    repository, client, query = create_repository(25)

    result = repository.count_by_status()

    assert result == 25
    client.schema.assert_called_once_with("medical")
    client.schema.return_value.table.assert_called_once_with("patients")
    query.eq.assert_not_called()


def test_count_patients_by_status():
    repository, _, query = create_repository(12)

    result = repository.count_by_status("Active")

    assert result == 12
    query.eq.assert_called_once_with("status", "Active")


def test_count_patients_rejects_missing_exact_count():
    repository, _, _ = create_repository(None)

    with pytest.raises(RuntimeError, match="exact row count"):
        repository.count_by_status()