import logging
from uuid import UUID

from fastapi import Depends, HTTPException, status

from app.core.dependencies.auth import (
    AuthenticatedUser,
    get_current_user,
)
from app.core.supabase import get_supabase_user_client


logger = logging.getLogger(__name__)


class CustomerUser(AuthenticatedUser):
    customer_id: UUID
    full_name: str
    customer_email: str


def get_current_customer(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CustomerUser:
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
            .table("customers")
            .select("id, auth_user_id, full_name, email")
            .eq("auth_user_id", str(current_user.id))
            .limit(1)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customer access is not enabled for this account.",
            )

        customer = response.data[0]

        if str(customer["auth_user_id"]) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customer access denied.",
            )

        return CustomerUser(
            id=current_user.id,
            email=current_user.email,
            access_token=current_user.access_token,
            customer_id=UUID(customer["id"]),
            full_name=customer["full_name"],
            customer_email=customer["email"],
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception("Customer authorization lookup failed.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Customer authorization service is temporarily unavailable.",
        ) from None