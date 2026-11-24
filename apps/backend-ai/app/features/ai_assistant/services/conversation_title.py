import re
import unicodedata


MAX_TITLE_LENGTH = 50
MAX_TITLE_WORDS = 7

LEADING_PHRASES = [
    "can you explain",
    "could you explain",
    "please explain",
    "tell me about",
    "what is the",
    "what are the",
    "how can i",
    "how do i",
    "i want to know about",
    "explain",
    "describe",
    "لطفا توضیح بده",
    "لطفاً توضیح بده",
    "توضیح بده",
    "درباره",
]


def generate_conversation_title(message: str) -> str:
    """Generate a short deterministic title without using an LLM."""

    if not message or not message.strip():
        return "New Conversation"

    text = unicodedata.normalize("NFKC", message)
    text = re.sub(r"\s+", " ", text).strip()

    # Keep only the first sentence.
    text = re.split(r"(?<=[.!?؟])\s+", text, maxsplit=1)[0]

    # Remove common introductory phrases.
    lowered = text.lower()

    for phrase in LEADING_PHRASES:
        if lowered.startswith(phrase + " "):
            text = text[len(phrase):].strip()
            break

    # Remove unnecessary punctuation.
    text = re.sub(r"^[\s:،,؛;؟?!.-]+|[\s:،,؛;؟?!.-]+$", "", text)

    words = text.split()

    if len(words) > MAX_TITLE_WORDS:
        text = " ".join(words[:MAX_TITLE_WORDS])

    if len(text) > MAX_TITLE_LENGTH:
        text = text[:MAX_TITLE_LENGTH].rsplit(" ", 1)[0]

    text = text.strip()

    if not text:
        return "New Conversation"

    # Capitalize English titles without changing Persian text.
    if re.search(r"[a-zA-Z]", text):
        text = text[0].upper() + text[1:]

    return text