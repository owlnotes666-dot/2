
import pytest
from unittest.mock import MagicMock
from datetime import date

from app.features.ai_assistant.services.database_agent.tool_executor import (
    ToolExecutor,
    ToolExecutionError,
)


@pytest.fixture
def repositories():
    return {
        "patients": MagicMock(),
        "doctors": MagicMock(),
        "appointments": MagicMock(),
        "staff": MagicMock(),
        "medical_records": MagicMock(),
    }


@pytest.fixture
def executor(repositories):
    return ToolExecutor(
        patient_repository=repositories["patients"],
        doctor_repository=repositories["doctors"],
        appointment_repository=repositories["appointments"],
        staff_repository=repositories["staff"],
        medical_record_repository=repositories["medical_records"],
        is_admin=True,
    )


def test_admin_can_get_patient_statistics(executor, repositories):
    repositories["patients"].count_by_status.return_value = 25

    result = executor.execute(
        "get_patient_statistics",
        {"status": "Active"},
    )

    assert result == {"total": 25}
    repositories["patients"].count_by_status.assert_called_once_with(
        "Active"
    )


def test_demo_user_cannot_create_database_tool_executor(repositories):
    with pytest.raises(ToolExecutionError, match="Admin access required"):
        ToolExecutor(
            patient_repository=repositories["patients"],
            doctor_repository=repositories["doctors"],
            appointment_repository=repositories["appointments"],
            staff_repository=repositories["staff"],
            medical_record_repository=repositories["medical_records"],
            is_admin=False,
        )

    for repository in repositories.values():
        assert repository.method_calls == []


def test_unknown_tool_is_rejected(executor):
    with pytest.raises(ToolExecutionError, match="Unknown"):
        executor.execute(
            "execute_sql",
            {},
        )


def test_extra_arguments_are_rejected(executor):
    with pytest.raises(ToolExecutionError, match="Invalid tool arguments"):
        executor.execute(
            "get_patient_statistics",
            {
                "status": "Active",
                "table": "patients",
            },
        )


def test_invalid_patient_status_is_rejected(executor):
    with pytest.raises(ToolExecutionError, match="Invalid status"):
        executor.execute(
            "get_patient_statistics",
            {"status": "Deleted"},
        )


def test_invalid_appointment_date_is_rejected(executor):
    with pytest.raises(ToolExecutionError, match="Invalid appointment date"):
        executor.execute(
            "get_appointment_statistics",
            {
                "status": None,
                "appointment_date": "not-a-date",
            },
        )


def test_doctor_statistics_use_correct_filters(executor, repositories):
    repositories["doctors"].count_by_specialty.return_value = 8

    result = executor.execute(
        "get_doctor_statistics",
        {
            "specialty": "Cardiology",
            "status": "Active",
        },
    )

    assert result == {"total": 8}
    repositories["doctors"].count_by_specialty.assert_called_once_with(
        specialty="Cardiology",
        status="Active",
    )


def test_medical_record_statistics_only_return_count(
    executor,
    repositories,
):
    repositories["medical_records"].count_records.return_value = 12

    result = executor.execute(
        "get_medical_record_statistics",
        {"status": "Pending"},
    )

    assert result == {"total": 12}
    assert set(result.keys()) == {"total"}


def test_appointment_statistics(executor, repositories):
    repositories["appointments"].count_appointments.return_value = 7

    result = executor.execute(
        "get_appointment_statistics",
        {
            "status": "Scheduled",
            "appointment_date": "2026-11-13",
        },
    )

    assert result == {"total": 7}

    repositories["appointments"].count_appointments.assert_called_once_with(
        status="Scheduled",
        appointment_date=date(2026, 11, 13),
    )


def test_staff_statistics(executor, repositories):
    repositories["staff"].count_staff.return_value = 10

    result = executor.execute(
        "get_staff_statistics",
        {
            "role": "Nurse",
            "status": "Active",
        },
    )

    assert result == {"total": 10}

    repositories["staff"].count_staff.assert_called_once_with(
        role="Nurse",
        status="Active",
    )


def test_invalid_doctor_specialty_is_rejected(executor):
    with pytest.raises(ToolExecutionError, match="Invalid filter"):
        executor.execute(
            "get_doctor_statistics",
            {
                "specialty": "",
                "status": "Active",
            },
        )


def test_invalid_staff_role_is_rejected(executor):
    with pytest.raises(ToolExecutionError, match="Invalid filter"):
        executor.execute(
            "get_staff_statistics",
            {
                "role": "",
                "status": "Active",
            },
        )
