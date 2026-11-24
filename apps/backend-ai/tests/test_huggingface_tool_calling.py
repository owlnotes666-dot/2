from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.core.providers.base import ProviderMessage
from app.core.providers.huggingface import HuggingFaceProvider


@pytest.mark.asyncio
async def test_generate_passes_required_tool_choice_and_parses_tool_call():
    provider = HuggingFaceProvider.__new__(HuggingFaceProvider)
    provider.client = SimpleNamespace(
        chat_completion=AsyncMock(
            return_value=SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(
                            content=None,
                            tool_calls=[
                                SimpleNamespace(
                                    id="doctor-count",
                                    function=SimpleNamespace(
                                        name="get_doctor_statistics",
                                        arguments=(
                                            '{"specialty": null, '
                                            '"status": "Active"}'
                                        ),
                                    ),
                                )
                            ],
                        )
                    )
                ],
                model="test-model",
                usage=None,
            )
        )
    )

    result = await provider.generate(
        messages=[
            ProviderMessage(
                role="user",
                content="How many active doctors do we have?",
            )
        ],
        model="test-model",
        tools=[
            {
                "type": "function",
                "function": {
                    "name": "get_doctor_statistics",
                    "description": "Count doctors.",
                    "parameters": {"type": "object"},
                },
            }
        ],
        tool_choice="required",
    )

    assert len(result.tool_calls) == 1
    assert result.tool_calls[0].name == "get_doctor_statistics"
    assert result.tool_calls[0].arguments == {
        "specialty": None,
        "status": "Active",
    }
    provider.client.chat_completion.assert_awaited_once()
    assert (
        provider.client.chat_completion.await_args.kwargs["tool_choice"]
        == "required"
    )
