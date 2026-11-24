from unittest.mock import MagicMock

import pytest

from app.features.ai_assistant.repositories.database.staff_repository import (
    StaffRepository,
)


def create_repository(count: int | None):
    client = MagicMock()
    query = MagicMock()

    client.schema.return_value.table.return_value.select.return_value = query
    query.eq.return_value = query

    response = MagicMock()
    response.count = count
    query.execute.return_value = response

    return StaffRepository(client), query


def test_count_all_staff():
    repository, query = create_repository(40)

    result = repository.count_staff()

    assert result == 40
    query.eq.assert_not_called()


def test_count_staff_by_role():
    repository, query = create_repository(12)

    result = repository.count_staff(role="Nurse")

    assert result == 12
    query.eq.assert_called_once_with("role", "Nurse")


def test_count_staff_by_status():
    repository, query = create_repository(30)

    result = repository.count_staff(status="Active")

    assert result == 30
    query.eq.assert_called_once_with("status", "Active")


def test_count_staff_by_role_and_status():
    repository, query = create_repository(8)

    result = repository.count_staff(
        role="Nurse",
        status="Active",
    )

    assert result == 8
    assert query.eq.call_count == 2
    query.eq.assert_any_call("role", "Nurse")
    query.eq.assert_any_call("status", "Active")


def test_count_staff_rejects_missing_exact_count():
    repository, _ = create_repository(None)

    with pytest.raises(RuntimeError, match="exact row count"):
        repository.count_staff()