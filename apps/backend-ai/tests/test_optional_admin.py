from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi import HTTPException, status
from pydantic import SecretStr

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_optional_admin,
)


@pytest.fixture
def authenticated_user():
    return AuthenticatedUser(
        id=uuid4(),
        email="demo@example.com",
        access_token=SecretStr("test-access-token"),
    )


def test_optional_admin_returns_user_for_admin(authenticated_user):
    with patch(
        "app.core.dependencies.auth.get_current_admin",
        return_value=authenticated_user,
    ):
        result = get_optional_admin(authenticated_user)

    assert result == authenticated_user


def test_optional_admin_returns_none_for_demo(authenticated_user):
    with patch(
        "app.core.dependencies.auth.get_current_admin",
        side_effect=HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        ),
    ):
        result = get_optional_admin(authenticated_user)

    assert result is None


@pytest.mark.parametrize(
    "error_status",
    [
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_503_SERVICE_UNAVAILABLE,
    ],
)
def test_optional_admin_reraises_other_errors(
    authenticated_user,
    error_status,
):
    with patch(
        "app.core.dependencies.auth.get_current_admin",
        side_effect=HTTPException(
            status_code=error_status,
            detail="Authorization failed.",
        ),
    ):
        with pytest.raises(HTTPException) as exc_info:
            get_optional_admin(authenticated_user)

    assert exc_info.value.status_code == error_status
