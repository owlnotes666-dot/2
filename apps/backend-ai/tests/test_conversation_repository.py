from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.features.ai_assistant.repositories.conversation_repository import (
    ConversationRepository,
)


@pytest.mark.parametrize(
    ("data", "expected"),
    [
        ([{"id": "conversation-id"}], True),
        ([], False),
    ],
)
def test_delete_conversation_uses_one_owner_scoped_request(data, expected):
    client = MagicMock()
    query = MagicMock()
    client.schema.return_value.table.return_value.delete.return_value = query
    query.eq.return_value = query
    query.execute.return_value = SimpleNamespace(data=data)

    conversation_id = uuid4()
    owner_id = uuid4()
    repository = ConversationRepository(client)

    result = repository.delete_conversation(
        conversation_id=conversation_id,
        owner_id=owner_id,
    )

    assert result is expected
    client.schema.assert_called_once_with("medical")
    client.schema.return_value.table.assert_called_once_with(
        "conversations"
    )
    client.schema.return_value.table.return_value.delete.assert_called_once()
    assert [call.args for call in query.eq.call_args_list] == [
        ("id", str(conversation_id)),
        ("owner_id", str(owner_id)),
    ]
    query.execute.assert_called_once()
