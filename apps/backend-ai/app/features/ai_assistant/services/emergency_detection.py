import re
from dataclasses import dataclass


@dataclass
class EmergencyDetectionResult:
    is_emergency: bool
    detected_signals: list[str]


EMERGENCY_PATTERNS = {
    "severe_chest_pain": [
        r"\bsevere chest pain\b",
        r"\bcrushing chest pain\b",
        r"\bchest pain with pressure\b",
    ],
    "breathing_difficulty": [
        r"\bdifficulty breathing\b",
        r"\bshortness of breath\b",
        r"\bcannot breathe\b",
        r"\bcan't breathe\b",
    ],
    "loss_of_consciousness": [
        r"\bunconscious\b",
        r"\blost consciousness\b",
        r"\bpassed out\b",
    ],
    "stroke_signs": [
        r"\bsudden facial drooping\b",
        r"\bsudden arm weakness\b",
        r"\bslurred speech\b",
        r"\bsudden difficulty speaking\b",
    ],
    "severe_bleeding": [
        r"\bsevere bleeding\b",
        r"\buncontrolled bleeding\b",
        r"\bbleeding heavily\b",
    ],
}


def is_negated(message: str, match: re.Match) -> bool:
    preceding_text = message[max(0, match.start() - 40):match.start()]

    negation_patterns = [
        r"\bno\b",
        r"\bnot\b",
        r"\bnever\b",
        r"\bwithout\b",
        r"\bdenies\b",
        r"\bdenied\b",
        r"\bdoesn't\b",
        r"\bdon't\b",
        r"\bdoes not\b",
        r"\bdo not\b",
        r"\bnot experiencing\b",
    ]

    return any(
        re.search(pattern, preceding_text, re.IGNORECASE)
        for pattern in negation_patterns
    )


def detect_medical_emergency(
    message: str,
) -> EmergencyDetectionResult:
    normalized_message = message.lower()

    detected_signals = []

    for signal, patterns in EMERGENCY_PATTERNS.items():
        for pattern in patterns:
            match = re.search(pattern, normalized_message)

            if match and not is_negated(normalized_message, match):
                detected_signals.append(signal)
                break

    return EmergencyDetectionResult(
        is_emergency=bool(detected_signals),
        detected_signals=detected_signals,
    )
