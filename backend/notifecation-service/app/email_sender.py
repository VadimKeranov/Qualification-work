import aiosmtplib
import logging
from email.message import EmailMessage
from app.config import settings

logger = logging.getLogger(__name__)

async def send_email(to_email: str, subject: str, body: str):
    logger.info(f"Preparing to send email to: {to_email} with subject: '{subject}'")
    message = EmailMessage()
    message["From"] = settings.SMTP_USER
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=True,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
        )
        logger.info(f"Email successfully sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}. Error: {str(e)}")
        raise e  # Прокидуємо помилку далі, щоб main.py зловив її та записав у БД