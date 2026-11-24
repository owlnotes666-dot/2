
from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_supabase_client() -> Client:
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key.get_secret_value(),
    )

def get_supabase_user_client(access_token: str) -> Client:
    client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key.get_secret_value(),
    )

    client.postgrest.auth(access_token)

    return client