
from datetime import date
from typing import Any

from app.features.ai_assistant.repositories.database.patient_repository import (
    PatientRepository,
)
from app.features.ai_assistant.repositories.database.doctor_repository import (
    DoctorRepository,
)
from app.features.ai_assistant.repositories.database.appointment_repository import (
    AppointmentRepository,
)
from app.features.ai_assistant.repositories.database.staff_repository import (
    StaffRepository,
)
from app.features.ai_assistant.repositories.database.medical_record_repository import (
    MedicalRecordRepository,
)


class ToolExecutionError(Exception):
    """Raised when a database tool cannot be executed."""


class ToolExecutor:
    """Executes explicitly allowed, read-only database tools."""

    ALLOWED_STATUSES = {"Active", "Inactive"}

    def __init__(
        self,
        patient_repository: PatientRepository,
        doctor_repository: DoctorRepository,
        appointment_repository: AppointmentRepository,
        staff_repository: StaffRepository,
        medical_record_repository: MedicalRecordRepository,
        *,
        is_admin: bool,
    ):
        if is_admin is not True:
            raise ToolExecutionError("Admin access required.")

        self.patient_repository = patient_repository
        self.doctor_repository = doctor_repository
        self.appointment_repository = appointment_repository
        self.staff_repository = staff_repository
        self.medical_record_repository = medical_record_repository

    @staticmethod
    def _validate_arguments(
        arguments: dict[str, Any],
        allowed_keys: set[str],
    ) -> None:
        if not isinstance(arguments, dict):
            raise ToolExecutionError("Invalid tool arguments.")

        if set(arguments.keys()) != allowed_keys:
            raise ToolExecutionError("Invalid tool arguments.")

    @classmethod
    def _validate_status(cls, status: Any) -> None:
        if status is not None and status not in cls.ALLOWED_STATUSES:
            raise ToolExecutionError("Invalid status filter.")

    @staticmethod
    def _validate_optional_string(value: Any) -> None:
        if value is not None:
            if not isinstance(value, str) or not value.strip():
                raise ToolExecutionError("Invalid filter value.")

            if len(value) > 100:
                raise ToolExecutionError("Filter value is too long.")

    def execute(
        self,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> dict[str, Any]:

        if tool_name == "get_patient_statistics":
            self._validate_arguments(arguments, {"status"})

            status = arguments["status"]
            self._validate_status(status)

            return {
                "total": self.patient_repository.count_by_status(status)
            }

        if tool_name == "get_doctor_statistics":
            self._validate_arguments(
                arguments,
                {"specialty", "status"},
            )

            specialty = arguments["specialty"]
            status = arguments["status"]

            self._validate_optional_string(specialty)
            self._validate_status(status)

            return {
                "total": self.doctor_repository.count_by_specialty(
                    specialty=specialty,
                    status=status,
                )
            }

        if tool_name == "get_appointment_statistics":
            self._validate_arguments(
                arguments,
                {"status", "appointment_date"},
            )

            status = arguments["status"]
            appointment_date = arguments["appointment_date"]

            self._validate_optional_string(status)

            if appointment_date is not None:
                if not isinstance(appointment_date, str):
                    raise ToolExecutionError("Invalid appointment date.")

                try:
                    appointment_date = date.fromisoformat(
                        appointment_date
                    )
                except ValueError as exc:
                    raise ToolExecutionError(
                        "Invalid appointment date."
                    ) from exc

            return {
                "total": self.appointment_repository.count_appointments(
                    status=status,
                    appointment_date=appointment_date,
                )
            }

        if tool_name == "get_staff_statistics":
            self._validate_arguments(arguments, {"role", "status"})

            role = arguments["role"]
            status = arguments["status"]

            self._validate_optional_string(role)
            self._validate_status(status)

            return {
                "total": self.staff_repository.count_staff(
                    role=role,
                    status=status,
                )
            }

        if tool_name == "get_medical_record_statistics":
            self._validate_arguments(arguments, {"status"})

            status = arguments["status"]
            self._validate_optional_string(status)

            return {
                "total": self.medical_record_repository.count_records(
                    status=status
                )
            }

        raise ToolExecutionError(
            "Unknown or unsupported database tool."
        )
