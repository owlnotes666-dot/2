from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.features.ai_assistant.api import dependencies
from app.core.dependencies.auth import AuthenticatedUser


def test_repository_dependency_for_admin(monkeypatch):
    user = AuthenticatedUser(
        id="11111111-1111-4111-8111-111111111111",
        access_token="fake-test-token",
    )

    fake_client = MagicMock()
    created_clients = []

    def mock_get_client(token):
        created_clients.append(token)
        return fake_client

    monkeypatch.setattr(
        dependencies,
        "get_supabase_user_client",
        mock_get_client,
    )

    repository = dependencies.get_knowledge_chunk_repository(user)

    assert repository.client is fake_client
    assert len(created_clients) == 1
    assert created_clients[0] == "fake-test-token"


def test_repository_dependency_without_token():
    user = AuthenticatedUser(
        id="11111111-1111-4111-8111-111111111111"
    )

    with pytest.raises(HTTPException) as exc:
        dependencies.get_knowledge_chunk_repository(user)

    assert exc.value.status_code == 401
