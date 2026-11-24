from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_admin,
)

from app.features.ai_assistant.api.dependencies import (
    get_file_processing_service,
    get_temporary_file_storage,
)

from app.features.ai_assistant.services.file_processing_service import (
    FileProcessingService,
)

from app.features.ai_assistant.services.temporary_file_storage import (
    TemporaryFileStorage,
)


@pytest.fixture
def storage():
    return TemporaryFileStorage()


@pytest.fixture
def admin_user():
    return AuthenticatedUser(
        id=uuid4(),
        email="admin@example.com",
    )


@pytest.fixture
def client(storage, admin_user):
    app.dependency_overrides.clear()

    app.dependency_overrides[
        get_current_admin
    ] = lambda: admin_user

    app.dependency_overrides[
        get_file_processing_service
    ] = lambda: FileProcessingService()

    app.dependency_overrides[
        get_temporary_file_storage
    ] = lambda: storage

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_admin_can_upload_txt_file(client, storage, admin_user):
    conversation_id = uuid4()

    response = client.post(
        "/api/v1/ai-assistant/files/upload",
        data={
            "conversation_id": str(conversation_id),
        },
        files={
            "file": (
                "medical-notes.txt",
                b"Medical report content",
                "text/plain",
            ),
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["conversation_id"] == str(conversation_id)
    assert data["filename"] == "medical-notes.txt"

    assert "Medical report content" in storage.get_context(
        owner_id=admin_user.id,
        conversation_id=conversation_id,
    )


def test_demo_user_cannot_upload_file(
    client,
    storage,
    admin_user,
):
    def deny_admin():
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    app.dependency_overrides[
        get_current_admin
    ] = deny_admin

    conversation_id = uuid4()

    response = client.post(
        "/api/v1/ai-assistant/files/upload",
        data={
            "conversation_id": str(conversation_id),
        },
        files={
            "file": (
                "medical-notes.txt",
                b"Medical report content",
                "text/plain",
            ),
        },
    )

    assert response.status_code == 403

    assert storage.get_context(
        owner_id=admin_user.id,
        conversation_id=conversation_id,
    ) == ""


def test_upload_rejects_unsupported_file(client):
    response = client.post(
        "/api/v1/ai-assistant/files/upload",
        data={
            "conversation_id": str(uuid4()),
        },
        files={
            "file": (
                "malicious.exe",
                b"some content",
                "application/octet-stream",
            ),
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported file format."


def test_upload_rejects_oversized_file(client):
    response = client.post(
        "/api/v1/ai-assistant/files/upload",
        data={
            "conversation_id": str(uuid4()),
        },
        files={
            "file": (
                "large.txt",
                b"a" * (10 * 1024 * 1024 + 1),
                "text/plain",
            ),
        },
    )

    assert response.status_code == 413
    assert response.json()["detail"] == (
        "File size exceeds the 10 MB limit."
    )
    
