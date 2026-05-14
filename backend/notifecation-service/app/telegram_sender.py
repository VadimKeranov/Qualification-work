import httpx
from app.config import settings


async def send_telegram_admin_alert(message_text: str):
    print(f"📢 [Telegram Placeholder]: {message_text}")

    if not settings.TELEGRAM_BOT_TOKEN or not settings.ADMIN_CHAT_ID:
        return
