import logging
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase_auth.errors import AuthApiError
from pydantic import BaseModel, Field, SecretStr

from app.core.security_audit import audit_security_event
from app.core.supabase import (
    get_supabase_client,
    get_supabase_user_client,
)


logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    id: UUID
    email: str | None = None
    access_token: SecretStr | None = Field(
        default=None,
        exclude=True,
        repr=False,
    )


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> AuthenticatedUser:

    ip_address = (
        request.client.host if request.client else None
    )

    if credentials is None:
        audit_security_event(
            event_name="authentication_failed",
            ip_address=ip_address,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.scheme.lower() != "bearer":
        audit_security_event(
            event_name="authentication_failed",
            ip_address=ip_address,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        supabase = get_supabase_client()

        response = supabase.auth.get_user(
            jwt=credentials.credentials
        )

        user = response.user

        if user is None:
            audit_security_event(
                event_name="authentication_failed",
                ip_address=ip_address,
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthenticatedUser(
            id=UUID(str(user.id)),
            email=user.email,
            access_token=SecretStr(credentials.credentials),
        )

    except AuthApiError:
        audit_security_event(
            event_name="authentication_failed",
            ip_address=ip_address,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    except HTTPException:
        raise

    except Exception:
        logger.error(
            "Unexpected error occurred during user authentication."
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is temporarily unavailable.",
        ) from None


def get_current_admin(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:

    if current_user.access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    try:
        supabase = get_supabase_user_client(
            current_user.access_token.get_secret_value()
        )

        response = (
            supabase.table("admins")
            .select("id")
            .eq("id", str(current_user.id))
            .limit(1)
            .execute()
        )

        if not response.data:
            audit_security_event(
                event_name="admin_authorization_denied",
                user_id=current_user.id,
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required.",
            )

        return current_user

    except HTTPException:
        raise

    except Exception:
        logger.error(
            "Unexpected error occurred during admin authorization."
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authorization service is temporarily unavailable.",
        ) from None


def get_optional_admin(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser | None:
    try:
        return get_current_admin(current_user)

    except HTTPException as exc:
        if exc.status_code == status.HTTP_403_FORBIDDEN:
            return None

        raise
