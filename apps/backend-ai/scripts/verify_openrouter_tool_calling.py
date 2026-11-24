import asyncio

from app.core.config import settings
from app.core.providers.base import ProviderMessage
from app.core.providers.openrouter import OpenRouterProvider


async def main():
    provider = OpenRouterProvider()

    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_patient_statistics",
                "description": (
                    "Retrieve the number of patients matching "
                    "the requested status."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "status": {
                            "type": "string",
                            "enum": ["Active", "Inactive"],
                        }
                    },
                    "required": ["status"],
                    "additionalProperties": False,
                },
            },
        }
    ]

    messages = [
        ProviderMessage(
            role="system",
            content=(
                "You are an assistant that uses available tools "
                "when they are relevant. Do not answer directly "
                "when the requested information requires a tool."
            ),
        ),
        ProviderMessage(
            role="user",
            content="How many active patients do we have?",
        ),
    ]

    response = await provider.generate(
        messages=messages,
        model=settings.ai_model,
        max_tokens=200,
        temperature=0,
        tools=tools,
    )

    print("Model:", response.model)
    print("Content:", response.content)
    print("Tool calls:", len(response.tool_calls))

    for tool_call in response.tool_calls:
        print("Tool name:", tool_call.name)
        print("Arguments:", tool_call.arguments)

    if not response.tool_calls:
        raise RuntimeError(
            "The model did not return a tool call."
        )

    assert response.tool_calls[0].name == "get_patient_statistics"
    assert response.tool_calls[0].arguments.get("status") == "Active"

    print("\nTool calling test passed!")


if __name__ == "__main__":
    asyncio.run(main())