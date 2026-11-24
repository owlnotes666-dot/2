import re
from dataclasses import dataclass


@dataclass
class InputGuardrailResult:
    is_valid: bool
    prompt_injection_suspected: bool
    flags: list[str]


SUSPICIOUS_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"disregard\s+(all\s+)?previous\s+instructions",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"show\s+(your\s+)?system\s+prompt",
    r"ignore\s+all\s+rules",
    r"bypass\s+(your\s+)?safety",
    r"act\s+as\s+an\s+unrestricted",
    r"developer\s+mode",
]


def inspect_user_input(message: str) -> InputGuardrailResult:
    flags: list[str] = []

    normalized_message = message.strip()

    if not normalized_message:
        flags.append("empty_message")

    if len(normalized_message) > 8000:
        flags.append("message_too_long")

    if "\x00" in normalized_message:
        flags.append("null_byte_detected")

    prompt_injection_suspected = any(
        re.search(pattern, normalized_message, re.IGNORECASE)
        for pattern in SUSPICIOUS_PATTERNS
    )

    if prompt_injection_suspected:
        flags.append("possible_prompt_injection")

    return InputGuardrailResult(
        is_valid=not any(
            flag in flags
            for flag in [
                "empty_message",
                "message_too_long",
                "null_byte_detected",
            ]
        ),
        prompt_injection_suspected=prompt_injection_suspected,
        flags=flags,
    )