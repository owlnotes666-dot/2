import json
import logging
from uuid import uuid4

from app.core.security_audit import audit_security_event


def test_audit_security_event(caplog):
    user_id = uuid4()

    with caplog.at_level(
        logging.INFO,
        logger="security.audit",
    ):
        audit_security_event(
            event_name="prompt_injection_detected",
            user_id=user_id,
            ip_address="127.0.0.1",
        )

    assert len(caplog.records) == 1

    event = json.loads(caplog.records[0].message)

    assert event["event"] == "prompt_injection_detected"
    assert event["user_id"] == str(user_id)
    assert event["ip_address"] == "127.0.0.1"
    assert "timestamp" in event


def test_audit_security_event_without_user(caplog):
    with caplog.at_level(
        logging.INFO,
        logger="security.audit",
    ):
        audit_security_event(
            event_name="authentication_failed",
        )

    event = json.loads(caplog.records[0].message)

    assert event["event"] == "authentication_failed"
    assert event["user_id"] is None
    assert event["ip_address"] is None