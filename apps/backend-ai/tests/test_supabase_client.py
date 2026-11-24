from unittest.mock import patch

from app.core.supabase import get_supabase_client


def test_supabase_client_is_created():
    get_supabase_client.cache_clear()

    with patch(
        "app.core.supabase.create_client"
    ) as mock_create_client:

        client = get_supabase_client()

        mock_create_client.assert_called_once()
        assert client == mock_create_client.return_value


def test_supabase_client_is_cached():
    get_supabase_client.cache_clear()

    with patch(
        "app.core.supabase.create_client"
    ) as mock_create_client:

        first_client = get_supabase_client()
        second_client = get_supabase_client()

        assert first_client is second_client
        mock_create_client.assert_called_once()

    get_supabase_client.cache_clear()