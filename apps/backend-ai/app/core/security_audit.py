import json
import logging

from datetime import datetime, timezone
from uuid import UUID


logger = logging.getLogger("security.audit")


def audit_security_event(
    event_name: str,
    user_id: UUID | None = None,
    ip_address: str | None = None,
) -> None:
    """
    Record a security event without storing sensitive information.
    """

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event_name,
        "user_id": str(user_id) if user_id else None,
        "ip_address": ip_address,
    }

    logger.info(json.dumps(event))