import pytest

from app.features.ai_assistant.services.conversation_title import (
    generate_conversation_title,
)


@pytest.mark.parametrize(
    "message, expected",
    [
        (
            "Can you explain the symptoms of diabetes?",
            "The symptoms of diabetes",
        ),
        (
            "How can I improve my sleep quality?",
            "Improve my sleep quality",
        ),
        (
            "Explain hypertension and its treatment.",
            "Hypertension and its treatment",
        ),
        (
            "سلام، درباره علائم بیماری دیابت توضیح بده.",
            "سلام، درباره علائم بیماری دیابت توضیح بده",
        ),
        (
            "",
            "New Conversation",
        ),
    ],
)
def test_generate_conversation_title(message, expected):
    assert generate_conversation_title(message) == expected


def test_title_does_not_exceed_maximum_length():
    message = "Explain " + "very " * 30 + "important medical information"

    title = generate_conversation_title(message)

    assert len(title) <= 50


def test_title_contains_at_most_seven_words():
    message = "Explain the symptoms and causes and treatment of diabetes"

    title = generate_conversation_title(message)

    assert len(title.split()) <= 7
