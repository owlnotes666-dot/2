import pytest

from app.features.ai_assistant.services.guardrails.output_guardrails import (
    inspect_ai_output,
)


def test_safe_output():
    result = inspect_ai_output(
        "A medical dashboard helps organize patient information."
    )

    assert result.is_safe is True
    assert result.flags == []


def test_empty_output():
    result = inspect_ai_output("   ")

    assert result.is_safe is False
    assert "empty_output" in result.flags


def test_output_too_long():
    result = inspect_ai_output(
        "a" * 12001
    )

    assert result.is_safe is False
    assert "output_too_long" in result.flags


@pytest.mark.parametrize(
    "content",
    [
        "You should take 500 mg.",
        "Take 2 tablets.",
        "I recommend that you take 100 mg.",
        "Prescribe aspirin immediately.",
    ],
)
def test_unsafe_prescription_detection(content):
    result = inspect_ai_output(content)

    assert result.is_safe is False
    assert "possible_unsafe_prescription" in result.flags


@pytest.mark.parametrize(
    "content",
    [
        "Patient ID: ABC12345",
        "Patient ID is PT-12345",
        "SSN: 123-45-6789",
        "Contact: patient@example.com",
    ],
)
def test_sensitive_data_detection(content):
    result = inspect_ai_output(content)

    assert result.is_safe is False
    assert "possible_sensitive_data" in result.flags


def test_output_is_trimmed():
    result = inspect_ai_output(
        "   Safe medical information.   "
    )

    assert result.sanitized_content == "Safe medical information."


def test_multiple_violations():
    result = inspect_ai_output(
        "You should take 500 mg. Patient ID: ABC12345"
    )

    assert result.is_safe is False
    assert "possible_unsafe_prescription" in result.flags
    assert "possible_sensitive_data" in result.flags
