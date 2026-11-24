from uuid import uuid4
from types import SimpleNamespace
from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.providers.base import ProviderResponse, ProviderToolCall
from app.main import app

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
    get_optional_admin,
)

from app.features.ai_assistant.api.routes import (
    get_ai_assistant_service,
)

from app.features.ai_assistant.api.dependencies import (
    get_temporary_file_storage,
)

from app.features.ai_assistant.schemas.chat import ChatResponse

from app.core.rate_limit import limiter

from app.features.ai_assistant.services.ai_assistant_service import (
    AIAssistantService,
)

from app.features.ai_assistant.services.temporary_file_storage import (
    TemporaryFileStorage,
)


class FakeAIAssistantService:
    def __init__(self):
        self.received_file_context = None

    async def generate_response(
        self,
        request,
        user_id=None,
        ip_address=None,
        file_context=None,
    ):
        self.received_file_context = file_context

        return ChatResponse(
            conversation_id=request.conversation_id,
            message="A medical dashboard helps organize healthcare information.",
            provider="openrouter",
            model="test-model",
        )


@pytest.fixture
def storage():
    return TemporaryFileStorage()


@pytest.fixture
def fake_ai_service():
    return FakeAIAssistantService()


@pytest.fixture
def client(storage, fake_ai_service):
    app.dependency_overrides.clear()

    app.dependency_overrides[
        get_ai_assistant_service
    ] = lambda: fake_ai_service

    app.dependency_overrides[
        get_temporary_file_storage
    ] = lambda: storage

    app.dependency_overrides[
        get_optional_admin
    ] = lambda: None

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_chat_requires_authentication(client):
    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={"message": "What is a medical dashboard?"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required."


def test_authenticated_user_can_chat(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={"message": "What is a medical dashboard?"},
    )

    assert response.status_code == 200
    assert (
        response.json()["message"]
        == "A medical dashboard helps organize healthcare information."
    )
    assert response.json()["provider"] == "openrouter"


def test_chat_rejects_invalid_message(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={"message": "   "},
    )

    assert response.status_code == 422


def test_chat_rate_limit(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    # Use a separate IP to isolate this test.
    with TestClient(
        app,
        client=("198.51.100.25", 12345),
    ) as rate_limit_client:

        responses = []

        for _ in range(11):
            response = rate_limit_client.post(
                "/api/v1/ai-assistant/chat",
                json={
                    "message": "What is a medical dashboard?"
                },
            )
            responses.append(response)

    assert all(
        response.status_code == 200
        for response in responses[:10]
    )

    assert responses[10].status_code == 429


def test_rate_limit_exceeded_is_audited(client):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    with patch(
        "app.main.audit_security_event"
    ) as mock_audit:

        with TestClient(
            app,
            client=("198.51.100.30", 12345),
        ) as rate_limit_client:

            responses = []

            for _ in range(11):
                response = rate_limit_client.post(
                    "/api/v1/ai-assistant/chat",
                    json={
                        "message": "What is a medical dashboard?"
                    },
                )
                responses.append(response)

    assert responses[10].status_code == 429

    mock_audit.assert_called_once_with(
        event_name="rate_limit_exceeded",
        ip_address="198.51.100.30",
    )


@pytest.mark.asyncio
async def test_chat_returns_web_sources(client, monkeypatch):
    user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    app.dependency_overrides[get_current_user] = lambda: user

    # Mock input guardrails
    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.check_user_message",
        lambda message: SimpleNamespace(
            is_allowed=True,
            is_emergency=False,
            prompt_injection_suspected=False,
        ),
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.inspect_pii",
        lambda message: SimpleNamespace(
            contains_pii=False,
            redacted_content=message,
        ),
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.detect_prompt_injection",
        AsyncMock(return_value=False),
    )

    # Mock output guardrails
    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.check_ai_response",
        lambda content: SimpleNamespace(
            is_safe=True,
            content=content,
        ),
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.detect_unsafe_output",
        AsyncMock(return_value=False),
    )

    # Mock LLM provider
    provider = MagicMock()

    provider.generate = AsyncMock(
        side_effect=[
            ProviderResponse(
                content=None,
                model="test-model",
                tool_calls=[
                    ProviderToolCall(
                        id="call_search_1",
                        name="search_web",
                        arguments={
                            "query": "diabetes treatment guidelines"
                        },
                    )
                ],
            ),
            ProviderResponse(
                content=(
                    "According to the available web sources, "
                    "diabetes treatment depends on individual "
                    "clinical circumstances."
                ),
                model="test-model",
                usage={
                    "prompt_tokens": 100,
                    "completion_tokens": 40,
                    "total_tokens": 140,
                },
            ),
        ]
    )

    monkeypatch.setattr(
        "app.features.ai_assistant.services.ai_assistant_service.get_ai_provider",
        lambda: provider,
    )

    # Mock Tavily search executor
    web_search_executor = MagicMock()

    web_search_executor.execute = AsyncMock(
        return_value={
            "query": "diabetes treatment guidelines",
            "results": [
                {
                    "title": "Diabetes Clinical Guidelines",
                    "url": "https://example.com/diabetes-guidelines",
                    "content": "Clinical guidelines overview.",
                    "score": 0.95,
                }
            ],
        }
    )

    # Use the real AI Assistant service
    ai_service = AIAssistantService(
        web_search_executor=web_search_executor,
    )

    app.dependency_overrides[
        get_ai_assistant_service
    ] = lambda: ai_service

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={
            "message": "Search for diabetes treatment guidelines."
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "diabetes treatment depends" in data["message"]

    assert len(data["web_sources"]) == 1

    assert data["web_sources"][0]["title"] == (
        "Diabetes Clinical Guidelines"
    )

    assert data["web_sources"][0]["url"] == (
        "https://example.com/diabetes-guidelines"
    )

    assert data["web_sources"][0]["score"] == 0.95

    web_search_executor.execute.assert_awaited_once_with(
        name="search_web",
        arguments={
            "query": "diabetes treatment guidelines"
        },
    )

    assert provider.generate.await_count == 2


def test_admin_chat_receives_only_own_file_context(
    client,
    storage,
    fake_ai_service,
):
    admin = AuthenticatedUser(
        id=uuid4(),
        email="admin@example.com",
    )

    conversation_id = uuid4()

    storage.add_file(
        owner_id=admin.id,
        conversation_id=conversation_id,
        filename="admin-report.txt",
        text="Admin private medical report.",
    )

    app.dependency_overrides[get_current_user] = lambda: admin
    app.dependency_overrides[get_optional_admin] = lambda: admin

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={
            "message": "Summarize my uploaded report.",
            "conversation_id": str(conversation_id),
        },
    )

    assert response.status_code == 200

    assert fake_ai_service.received_file_context is not None
    assert "Admin private medical report." in (
        fake_ai_service.received_file_context
    )


def test_demo_user_cannot_access_admin_file_context(
    client,
    storage,
    fake_ai_service,
):
    admin = AuthenticatedUser(
        id=uuid4(),
        email="admin@example.com",
    )

    demo_user = AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
    )

    conversation_id = uuid4()

    storage.add_file(
        owner_id=admin.id,
        conversation_id=conversation_id,
        filename="admin-report.txt",
        text="Admin private medical report.",
    )

    app.dependency_overrides[get_current_user] = lambda: demo_user
    app.dependency_overrides[get_optional_admin] = lambda: None

    response = client.post(
        "/api/v1/ai-assistant/chat",
        json={
            "message": "Read this uploaded report.",
            "conversation_id": str(conversation_id),
        },
    )

    assert response.status_code == 200

    assert fake_ai_service.received_file_context is None