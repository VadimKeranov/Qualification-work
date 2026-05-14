from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import NotificationLog

class NotificationRepository:
    @staticmethod
    async def log_notification(session: AsyncSession, channel: str, recipient: str, subject: str, status: str):
        new_log = NotificationLog(
            channel=channel,
            recipient=recipient,
            subject=subject,
            status=status
        )
        session.add(new_log)
        await session.commit()