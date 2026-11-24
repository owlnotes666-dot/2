from unittest.mock import MagicMock

import pytest

from app.features.ai_assistant.repositories.database.medical_record_repository import (
    MedicalRecordRepository,
)


def create_repository(count: int | None):
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.table.return_value.select.return_value = query
    query.eq.return_value = query

    response = MagicMock()
    response.count = count
    query.execute.return_value = response

    return MedicalRecordRepository(client), query


def test_count_all_records():
    repository, query = create_repository(50)

    result = repository.count_records()

    assert result == 50
    query.eq.assert_not_called()


def test_count_records_by_status():
    repository, query = create_repository(15)

    result = repository.count_records(status="Pending")

    assert result == 15
    query.eq.assert_called_once_with("status", "Pending")


def test_count_records_rejects_missing_exact_count():
    repository, _ = create_repository(None)

    with pytest.raises(RuntimeError, match="exact row count"):
        repository.count_records()