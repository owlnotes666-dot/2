import json
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.core.providers.base import (
    ProviderMessage,
    ProviderToolCall,
)
from app.core.providers.exceptions import ProviderResponseError
from app.core.providers.openrouter import OpenRouterProvider


@pytest.mark.asyncio
async def test_generate_returns_tool_calls():
    provider = OpenRouterProvider.__new__(OpenRouterProvider)

    tool_call = SimpleNamespace(
        id="call_123",
        function=SimpleNamespace(
            name="get_patient_statistics",
            arguments='{"status": "Active"}',
        ),
    )

    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content=None,
                    tool_calls=[tool_call],
                )
            )
        ],
        model="test-model",
        usage=None,
    )

    provider.client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=AsyncMock(return_value=response)
            )
        )
    )

    messages = [
        ProviderMessage(
            role="user",
            content="How many active patients do we have?",
        )
    ]
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_patient_statistics",
                "description": "Get patient statistics.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string"},
                    },
                },
            },
        }
    ]

    result = await provider.generate(
        messages=messages,
        model="test-model",
        tools=tools,
    )

    assert result.content is None
    assert len(result.tool_calls) == 1

    assert result.tool_calls[0].id == "call_123"
    assert result.tool_calls[0].name == "get_patient_statistics"
    assert result.tool_calls[0].arguments == {"status": "Active"}

    request_args = (
        provider.client.chat.completions.create.await_args.kwargs
    )

    assert request_args["tool_choice"] == "auto"
    assert len(request_args["tools"]) == 1

    await provider.generate(
        messages=messages,
        model="test-model",
        tools=tools,
        tool_choice="required",
    )

    required_request_args = (
        provider.client.chat.completions.create.await_args.kwargs
    )
    assert required_request_args["tool_choice"] == "required"


@pytest.mark.asyncio
async def test_generate_rejects_invalid_tool_arguments():
    provider = OpenRouterProvider.__new__(OpenRouterProvider)

    tool_call = SimpleNamespace(
        id="call_456",
        function=SimpleNamespace(
            name="get_patient_statistics",
            arguments="{invalid-json",
        ),
    )

    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content=None,
                    tool_calls=[tool_call],
                )
            )
        ],
        model="test-model",
        usage=None,
    )

    provider.client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(
                create=AsyncMock(return_value=response)
            )
        )
    )

    with pytest.raises(ProviderResponseError):
        await provider.generate(
            messages=[
                ProviderMessage(
                    role="user",
                    content="Get patient statistics.",
                )
            ],
            model="test-model",
            tools=[],
        )


@pytest.mark.asyncio
async def test_generate_serializes_tool_messages():
    provider = OpenRouterProvider.__new__(OpenRouterProvider)

    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content="There are 12 active patients.",
                    tool_calls=None,
                )
            )
        ],
        model="test-model",
        usage=None,
    )

    mock_create = AsyncMock(return_value=response)

    provider.client = SimpleNamespace(
        chat=SimpleNamespace(
            completions=SimpleNamespace(create=mock_create)
        )
    )

    await provider.generate(
        messages=[
            ProviderMessage(
                role="assistant",
                content=None,
                tool_calls=[
                    ProviderToolCall(
                        id="call_789",
                        name="get_patient_statistics",
                        arguments={"status": "Active"},
                    )
                ],
            ),
            ProviderMessage(
                role="tool",
                content='{"count": 12}',
                tool_call_id="call_789",
            ),
        ],
        model="test-model",
    )

    request_messages = mock_create.await_args.kwargs["messages"]

    assert request_messages[0]["role"] == "assistant"
    assert request_messages[0]["tool_calls"][0]["id"] == "call_789"

    assert request_messages[1]["role"] == "tool"
    assert request_messages[1]["tool_call_id"] == "call_789"
    assert json.loads(request_messages[0]["tool_calls"][0]["function"]["arguments"]) == {
        "status": "Active"
    }