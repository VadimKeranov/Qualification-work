import httpx
from app.config import settings


async def send_telegram_admin_alert(message_text: str):
    """
    Отправляет уведомление админу в Telegram.
    Это 'подложка': сейчас она просто пишет в консоль,
    но готова к работе с API Telegram.
    """
    print(f"📢 [Telegram Placeholder]: {message_text}")

    if not settings.TELEGRAM_BOT_TOKEN or not settings.ADMIN_CHAT_ID:
        return

    # Реальная отправка (раскомментируй, когда будет токен):
    # url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    # async with httpx.AsyncClient() as client:
    #     payload = {"chat_id": settings.ADMIN_CHAT_ID, "text": message_text}
    #     await client.post(url, json=payload)