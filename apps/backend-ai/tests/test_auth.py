
from unittest.mock import MagicMock, patch
from uuid import uuid4
from starlette.requests import Request

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.dependencies.auth import get_current_user


def create_mock_request():
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/ai-assistant/chat",
        "headers": [],
        "client": ("127.0.0.1", 12345),
        "server": ("localhost", 8000),
        "scheme": "http",
        "query_string": b"",
    }

    return Request(scope)


@pytest.fixture
def valid_credentials():
    return HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="test-access-token",
    )


@pytest.fixture
def mock_supabase():
    with patch(
        "app.core.dependencies.auth.get_supabase_client"
    ) as mock_client:
        yield mock_client


def test_authentication_without_token():
    with pytest.raises(HTTPException) as exc:
        get_current_user(
            request=create_mock_request(),
            credentials=None,
        )

    assert exc.value.status_code == 401
    assert exc.value.detail == "Authentication required."


def test_successful_authentication(
    valid_credentials,
    mock_supabase,
):
    user_id = uuid4()

    mock_user = MagicMock()
    mock_user.id = str(user_id)
    mock_user.email = "demo@example.com"

    mock_supabase.return_value.auth.get_user.return_value.user = mock_user

    result = get_current_user(
        request=create_mock_request(),
        credentials=valid_credentials,
    )

    assert result.id == user_id
    assert result.email == "demo@example.com"

    mock_supabase.return_value.auth.get_user.assert_called_once_with(
        jwt="test-access-token"
    )


def test_authentication_when_user_is_missing(
    valid_credentials,
    mock_supabase,
):
    mock_supabase.return_value.auth.get_user.return_value.user = None

    with pytest.raises(HTTPException) as exc:
        get_current_user(
            request=create_mock_request(),
            credentials=valid_credentials,
        )

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid or expired access token."


def test_authentication_service_unavailable(
    valid_credentials,
    mock_supabase,
):
    mock_supabase.return_value.auth.get_user.side_effect = RuntimeError(
        "Internal authentication error"
    )

    with pytest.raises(HTTPException) as exc:
        get_current_user(
            request=create_mock_request(),
            credentials=valid_credentials,
        )

    assert exc.value.status_code == 503
    assert (
        exc.value.detail
        == "Authentication service is temporarily unavailable."
    )


def test_authentication_failure_is_audited():
    with patch(
        "app.core.dependencies.auth.audit_security_event"
    ) as mock_audit:

        with pytest.raises(HTTPException):
            get_current_user(
                request=create_mock_request(),
                credentials=None,
            )

    mock_audit.assert_called_once_with(
        event_name="authentication_failed",
        ip_address="127.0.0.1",
    )


def test_missing_user_is_audited(
    valid_credentials,
    mock_supabase,
):
    mock_supabase.return_value.auth.get_user.return_value.user = None

    with patch(
        "app.core.dependencies.auth.audit_security_event"
    ) as mock_audit:

        with pytest.raises(HTTPException):
            get_current_user(
                request=create_mock_request(),
                credentials=valid_credentials,
            )

    mock_audit.assert_called_once_with(
        event_name="authentication_failed",
        ip_address="127.0.0.1",
    )

    # Ensure sensitive credentials are not passed to the audit logger.
    audit_arguments = str(mock_audit.call_args)

    assert "test-access-token" not in audit_arguments
    assert "demo@example.com" not in audit_arguments
