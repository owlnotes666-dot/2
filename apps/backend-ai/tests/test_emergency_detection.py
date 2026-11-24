import pytest

from app.features.ai_assistant.services.emergency_detection import (
    detect_medical_emergency,
)


@pytest.mark.parametrize(
    "message, expected_signal",
    [
        (
            "I have severe chest pain.",
            "severe_chest_pain",
        ),
        (
            "I am having difficulty breathing.",
            "breathing_difficulty",
        ),
        (
            "The patient is unconscious.",
            "loss_of_consciousness",
        ),
        (
            "The patient has slurred speech.",
            "stroke_signs",
        ),
        (
            "I have uncontrolled bleeding.",
            "severe_bleeding",
        ),
    ],
)
def test_emergency_detection(message, expected_signal):
    result = detect_medical_emergency(message)

    assert result.is_emergency is True
    assert expected_signal in result.detected_signals


def test_multiple_emergency_signals():
    message = (
        "I have severe chest pain and difficulty breathing."
    )

    result = detect_medical_emergency(message)

    assert result.is_emergency is True
    assert "severe_chest_pain" in result.detected_signals
    assert "breathing_difficulty" in result.detected_signals


def test_non_emergency_message():
    result = detect_medical_emergency(
        "I have a mild headache."
    )

    assert result.is_emergency is False
    assert result.detected_signals == []


def test_case_insensitive_detection():
    result = detect_medical_emergency(
        "I HAVE SEVERE CHEST PAIN."
    )

    assert result.is_emergency is True
    
    
def test_negated_chest_pain():
    result = detect_medical_emergency(
        "I do not have severe chest pain."
    )

    assert result.is_emergency is False


def test_negated_breathing_difficulty():
    result = detect_medical_emergency(
        "I have no difficulty breathing."
    )

    assert result.is_emergency is False