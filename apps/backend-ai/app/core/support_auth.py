import logging
from typing import Literal

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
)
from app.core.supabase import get_supabase_user_client


logger = logging.getLogger(__name__)


class SupportUser(AuthenticatedUser):
    full_name: str | None = None
    role: Literal["admin", "agent"]
    is_active: bool


def get_current_support_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> SupportUser:
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
            supabase.schema("support")
            .table("profiles")
            .select("id, full_name, role, is_active")
            .eq("id", str(current_user.id))
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Support access is not enabled for this account.",
            )

        profile = response.data[0]

        if not profile.get("is_active"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your Support account is inactive.",
            )

        if profile.get("role") not in ("admin", "agent"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid Support role.",
            )

        return SupportUser(
            id=current_user.id,
            email=current_user.email,
            access_token=current_user.access_token,
            full_name=profile.get("full_name"),
            role=profile["role"],
            is_active=profile["is_active"],
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Support authorization lookup failed."
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Support authorization service is temporarily unavailable.",
        ) from None


def get_current_support_admin(
    current_user: SupportUser = Depends(get_current_support_user),
) -> SupportUser:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Support admin access required.",
        )

    return current_user


def get_current_support_agent(
    current_user: SupportUser = Depends(get_current_support_user),
) -> SupportUser:
    return current_user