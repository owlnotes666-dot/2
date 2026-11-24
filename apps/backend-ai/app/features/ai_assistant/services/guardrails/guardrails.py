from dataclasses import dataclass

from app.features.ai_assistant.services.guardrails.input_guardrails import (
    inspect_user_input,
)
from app.features.ai_assistant.services.emergency_detection import (
    detect_medical_emergency,
)
from app.features.ai_assistant.services.guardrails.output_guardrails import (
    inspect_ai_output,
)


@dataclass
class GuardrailCheckResult:
    is_allowed: bool
    is_emergency: bool
    prompt_injection_suspected: bool
    flags: list[str]


@dataclass
class OutputGuardrailCheckResult:
    is_safe: bool
    content: str
    flags: list[str]


def check_user_message(message: str) -> GuardrailCheckResult:
    input_result = inspect_user_input(message)

    if not input_result.is_valid:
        return GuardrailCheckResult(
            is_allowed=False,
            is_emergency=False,
            prompt_injection_suspected=(
                input_result.prompt_injection_suspected
            ),
            flags=input_result.flags,
        )

    emergency_result = detect_medical_emergency(message)

    flags = list(input_result.flags)

    if emergency_result.is_emergency:
        flags.append("medical_emergency_detected")

    return GuardrailCheckResult(
        is_allowed=True,
        is_emergency=emergency_result.is_emergency,
        prompt_injection_suspected=(
            input_result.prompt_injection_suspected
        ),
        flags=flags,
    )


def check_ai_response(content: str) -> OutputGuardrailCheckResult:
    output_result = inspect_ai_output(content)

    return OutputGuardrailCheckResult(
        is_safe=output_result.is_safe,
        content=output_result.sanitized_content,
        flags=output_result.flags,
    )
