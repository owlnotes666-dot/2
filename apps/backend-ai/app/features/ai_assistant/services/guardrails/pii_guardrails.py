import re
from dataclasses import dataclass


@dataclass
class PIIGuardrailResult:
    contains_pii: bool
    redacted_content: str
    detected_types: list[str]


PII_PATTERNS = {
    "email": (
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"
    ),
    "phone": (
        r"(?<!\w)(?:\+?\d{1,3}[-.\s]?)?"
        r"(?:\(?\d{2,4}\)?[-.\s]?)?"
        r"\d{3,4}[-.\s]?\d{3,4}(?!\w)"
    ),
    "ssn": (
        r"\b\d{3}-\d{2}-\d{4}\b"
    ),
    "patient_id": (
        r"\bpatient\s+id\s*(?::|#|is)\s*[\w-]+\b"
    ),
}


def inspect_pii(content: str) -> PIIGuardrailResult:
    redacted_content = content
    detected_types = []

    for pii_type, pattern in PII_PATTERNS.items():

        if re.search(pattern, redacted_content, re.IGNORECASE):
            detected_types.append(pii_type)

            redacted_content = re.sub(
                pattern,
                f"[REDACTED_{pii_type.upper()}]",
                redacted_content,
                flags=re.IGNORECASE,
            )

    return PIIGuardrailResult(
        contains_pii=len(detected_types) > 0,
        redacted_content=redacted_content,
        detected_types=detected_types,
    )
