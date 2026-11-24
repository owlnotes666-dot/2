from uuid import uuid4
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_admin,
)
from app.features.ai_assistant.api.routes import (
    get_ai_assistant_service,
)


@pytest.fixture
def admin():
    return AuthenticatedUser(
        id=uuid4(),
        email="admin@example.com",
    )


@pytest.fixture
def repository(admin):
    repo = MagicMock()

    repo.list_conversations.return_value = [
        {
            "id": str(uuid4()),
            "owner_id": str(admin.id),
            "title": "Test conversation",
        }
    ]

    repo.get_conversation.return_value = {
        "id": str(uuid4()),
        "owner_id": str(admin.id),
        "title": "Test conversation",
    }

    repo.get_messages.return_value = [
        {
            "role": "user",
            "content": "Hello",
        },
        {
            "role": "assistant",
            "content": "Hello. How can I help?",
        },
    ]

    return repo


@pytest.fixture
def client(admin, repository):
    service = MagicMock()
    service.conversation_repository = repository

    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_admin] = lambda: admin
    app.dependency_overrides[get_ai_assistant_service] = (
        lambda: service
    )

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_admin_can_list_own_conversations(
    client,
    admin,
    repository,
):
    response = client.get(
        "/api/v1/ai-assistant/conversations"
    )

    assert response.status_code == 200
    assert len(response.json()) == 1

    repository.list_conversations.assert_called_once_with(
        owner_id=admin.id
    )


def test_admin_can_retrieve_conversation_messages(
    client,
    repository,
):
    conversation_id = uuid4()

    repository.get_conversation.return_value["id"] = str(
        conversation_id
    )

    response = client.get(
        f"/api/v1/ai-assistant/conversations/{conversation_id}"
    )

    assert response.status_code == 200
    assert response.json()["conversation"]["id"] == str(
        conversation_id
    )
    assert len(response.json()["messages"]) == 2

    repository.get_messages.assert_called_once_with(
        conversation_id
    )


def test_admin_cannot_access_another_users_conversation(
    client,
    repository,
):
    conversation_id = uuid4()

    repository.get_conversation.return_value = {
        "id": str(conversation_id),
        "owner_id": str(uuid4()),
        "title": "Private conversation",
    }

    response = client.get(
        f"/api/v1/ai-assistant/conversations/{conversation_id}"
    )

    assert response.status_code == 404
    repository.get_messages.assert_not_called()


def test_admin_cannot_access_nonexistent_conversation(
    client,
    repository,
):
    conversation_id = uuid4()
    repository.get_conversation.return_value = None

    response = client.get(
        f"/api/v1/ai-assistant/conversations/{conversation_id}"
    )

    assert response.status_code == 404
    repository.get_messages.assert_not_called()


def test_invalid_conversation_id_is_rejected(client):
    response = client.get(
        "/api/v1/ai-assistant/conversations/not-a-uuid"
    )

    assert response.status_code == 422


def test_conversation_api_requires_admin(repository):
    service = MagicMock()
    service.conversation_repository = repository

    app.dependency_overrides.clear()
    app.dependency_overrides[get_ai_assistant_service] = (
        lambda: service
    )

    with TestClient(app) as test_client:
        response = test_client.get(
            "/api/v1/ai-assistant/conversations"
        )

    app.dependency_overrides.clear()

    assert response.status_code in (401, 403)


def test_admin_can_delete_own_conversation(
    client,
    admin,
    repository,
):
    conversation_id = uuid4()

    repository.delete_conversation.return_value = True

    response = client.delete(
        f"/api/v1/ai-assistant/conversations/{conversation_id}"
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Conversation deleted successfully."
    )

    repository.delete_conversation.assert_called_once_with(
        conversation_id=conversation_id,
        owner_id=admin.id,
    )
    repository.get_conversation.assert_not_called()


def test_admin_cannot_delete_another_users_conversation(
    client,
    admin,
    repository,
):
    conversation_id = uuid4()
    repository.delete_conversation.return_value = False

    response = client.delete(
        f"/api/v1/ai-assistant/conversations/{conversation_id}"
    )

    assert response.status_code == 404
    repository.delete_conversation.assert_called_once_with(
        conversation_id=conversation_id,
        owner_id=admin.id,
    )


def test_admin_cannot_delete_nonexistent_conversation(
    client,
    repository,
):
    conversation_id = uuid4()
    repository.delete_conversation.return_value = False

    response = client.delete(
        f"/api/v1/ai-assistant/conversations/{conversation_id}"
    )

    assert response.status_code == 404
    repository.delete_conversation.assert_called_once()


def test_invalid_conversation_id_delete_is_rejected(client):
    response = client.delete(
        "/api/v1/ai-assistant/conversations/not-a-uuid"
    )

    assert response.status_code == 422
