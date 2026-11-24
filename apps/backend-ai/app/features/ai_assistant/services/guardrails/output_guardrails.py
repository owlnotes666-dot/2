import re
from dataclasses import dataclass

from app.features.ai_assistant.services.guardrails.pii_guardrails import (
    inspect_pii,
)


@dataclass
class OutputGuardrailResult:
    is_safe: bool
    flags: list[str]
    sanitized_content: str


UNSAFE_PRESCRIPTION_PATTERNS = [
    r"\btake\s+\d+\s*(mg|mcg|g)\b",
    r"\bprescribe\s+\w+",
    r"\byou should take\b",
    r"\btake\s+\d+\s+tablets?\b",
]

SENSITIVE_DATA_PATTERNS = [
    r"\b\d{3}-\d{2}-\d{4}\b",
    r"\bpatient\s+id\s*[:#]\s*\w+",
]


def inspect_ai_output(
    content: str,
    max_length: int = 12000,
) -> OutputGuardrailResult:

    flags: list[str] = []

    normalized_content = content.strip()

    if not normalized_content:
        flags.append("empty_output")

    if len(normalized_content) > max_length:
        flags.append("output_too_long")

    if any(
        re.search(pattern, normalized_content, re.IGNORECASE)
        for pattern in UNSAFE_PRESCRIPTION_PATTERNS
    ):
        flags.append("possible_unsafe_prescription")

    pii_result = inspect_pii(normalized_content)

    if pii_result.contains_pii:
        flags.append("possible_sensitive_data")

    if any(
        re.search(pattern, normalized_content, re.IGNORECASE)
        for pattern in SENSITIVE_DATA_PATTERNS
    ):
        flags.append("possible_sensitive_data")

    is_safe = len(flags) == 0

    return OutputGuardrailResult(
        is_safe=is_safe,
        flags=list(set(flags)),
        sanitized_content=normalized_content,
    )
