from app.features.ai_assistant.services.guardrails.pii_guardrails import (
    inspect_pii,
)


def test_detect_email():
    result = inspect_pii(
        "Contact the patient at patient@example.com"
    )

    assert result.contains_pii is True
    assert "email" in result.detected_types
    assert "[REDACTED_EMAIL]" in result.redacted_content


def test_detect_patient_id():
    result = inspect_pii(
        "Patient ID: PT-12345"
    )

    assert result.contains_pii is True
    assert "patient_id" in result.detected_types


def test_detect_ssn():
    result = inspect_pii(
        "Patient SSN is 123-45-6789"
    )

    assert result.contains_pii is True
    assert "ssn" in result.detected_types


def test_clean_message():
    result = inspect_pii(
        "What is a medical dashboard?"
    )

    assert result.contains_pii is False
    assert result.detected_types == []
    assert result.redacted_content == (
        "What is a medical dashboard?"
    )


def test_multiple_pii_detection():
    result = inspect_pii(
        "Email: patient@example.com, Patient ID: PT-12345"
    )

    assert result.contains_pii is True
    assert "email" in result.detected_types
    assert "patient_id" in result.detected_types
    assert "patient@example.com" not in result.redacted_content
    assert "PT-12345" not in result.redacted_content
