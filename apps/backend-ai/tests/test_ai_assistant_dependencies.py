from unittest.mock import MagicMock

from pydantic import SecretStr

from app.core.dependencies.auth import AuthenticatedUser
from app.features.ai_assistant.api import dependencies


def test_demo_does_not_receive_database_tools(monkeypatch):
    client = MagicMock()

    monkeypatch.setattr(
        dependencies,
        "get_supabase_user_client",
        lambda token: client,
    )

    monkeypatch.setattr(
        dependencies,
        "KnowledgeChunkRepository",
        MagicMock(),
    )

    monkeypatch.setattr(
        dependencies,
        "RetrievalService",
        MagicMock(),
    )

    monkeypatch.setattr(
        dependencies,
        "ContextBuilder",
        MagicMock(),
    )

    tool_executor_mock = MagicMock()

    monkeypatch.setattr(
        dependencies,
        "ToolExecutor",
        tool_executor_mock,
    )

    assistant_mock = MagicMock()

    monkeypatch.setattr(
        dependencies,
        "AIAssistantService",
        assistant_mock,
    )

    demo_user = AuthenticatedUser(
        id="c1c07d5a-467b-40bc-8ad1-b2397b641766",
        access_token=SecretStr("demo-token"),
    )

    dependencies.get_ai_assistant_service(
        current_user=demo_user,
        current_admin=None,
    )

    tool_executor_mock.assert_not_called()

    assistant_mock.assert_called_once()

    assert (
        assistant_mock.call_args.kwargs["tool_executor"]
        is None
    )


def test_admin_receives_database_tools(monkeypatch):
    client = MagicMock()

    monkeypatch.setattr(
        dependencies,
        "get_supabase_user_client",
        lambda token: client,
    )

    monkeypatch.setattr(
        dependencies,
        "KnowledgeChunkRepository",
        MagicMock(),
    )

    monkeypatch.setattr(
        dependencies,
        "RetrievalService",
        MagicMock(),
    )

    monkeypatch.setattr(
        dependencies,
        "ContextBuilder",
        MagicMock(),
    )

    repository_mocks = {
        "PatientRepository": MagicMock(),
        "DoctorRepository": MagicMock(),
        "AppointmentRepository": MagicMock(),
        "StaffRepository": MagicMock(),
        "MedicalRecordRepository": MagicMock(),
    }

    for name, mock_class in repository_mocks.items():
        monkeypatch.setattr(dependencies, name, mock_class)

    tool_executor_mock = MagicMock()

    monkeypatch.setattr(
        dependencies,
        "ToolExecutor",
        tool_executor_mock,
    )

    assistant_mock = MagicMock()

    monkeypatch.setattr(
        dependencies,
        "AIAssistantService",
        assistant_mock,
    )

    admin_user = AuthenticatedUser(
        id="b96ccaf2-89b0-4f9a-ba9c-aa4b55bf6a40",
        access_token=SecretStr("admin-token"),
    )

    dependencies.get_ai_assistant_service(
        current_user=admin_user,
        current_admin=admin_user,
    )

    for mock_class in repository_mocks.values():
        mock_class.assert_called_once_with(client)

    tool_executor_mock.assert_called_once()

    executor_kwargs = tool_executor_mock.call_args.kwargs

    assert executor_kwargs["is_admin"] is True

    assistant_mock.assert_called_once()

    assert (
        assistant_mock.call_args.kwargs["tool_executor"]
        == tool_executor_mock.return_value
    )
