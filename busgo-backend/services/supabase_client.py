from supabase import create_client
from config import get_settings

settings = get_settings()

def get_supabase():
    if not settings.supabase_url or not settings.supabase_service_key:
        return None
    return create_client(settings.supabase_url, settings.supabase_service_key)
