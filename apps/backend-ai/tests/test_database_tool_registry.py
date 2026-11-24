from app.features.ai_assistant.services.database_agent.tool_registry import (
    DATABASE_TOOLS,
    get_database_tools,
    get_database_tools_for_question,
)

EXPECTED_TOOLS = {
    "get_patient_statistics",
    "get_doctor_statistics",
    "get_appointment_statistics",
    "get_staff_statistics",
    "get_medical_record_statistics",
}


def test_registry_contains_all_expected_tools():
    tools = get_database_tools()

    tool_names = {
        tool["function"]["name"]
        for tool in tools
    }

    assert tool_names == EXPECTED_TOOLS


def test_all_tools_have_valid_function_structure():
    tools = get_database_tools()

    for tool in tools:
        assert tool["type"] == "function"
        assert "name" in tool["function"]
        assert "description" in tool["function"]
        assert "parameters" in tool["function"]


def test_all_tools_reject_additional_properties():
    tools = get_database_tools()

    for tool in tools:
        parameters = tool["function"]["parameters"]

        assert parameters["additionalProperties"] is False


def test_get_database_tools_returns_a_new_list():
    first = get_database_tools()
    second = get_database_tools()

    assert first is not second
    assert first == second


def test_registry_does_not_expose_write_operations():
    tool_names = {
        tool["function"]["name"]
        for tool in DATABASE_TOOLS
    }

    forbidden_operations = {
        "insert",
        "update",
        "delete",
        "execute_sql",
        "run_query",
    }

    assert tool_names.isdisjoint(forbidden_operations)


def test_persian_doctor_count_question_selects_doctor_tool():
    tools = get_database_tools_for_question(
        "چندتا دکتر active داریم الان؟"
    )

    assert tools is not None
    assert [tool["function"]["name"] for tool in tools] == [
        "get_doctor_statistics"
    ]
