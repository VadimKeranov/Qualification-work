import aio_pika
import json
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class EventPublisher:
    @staticmethod
    async def publish(queue_name: str, message: dict):
        """Публикует сообщение в указанную очередь RabbitMQ."""
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            async with connection:
                channel = await connection.channel()
                await channel.declare_queue(queue_name, durable=True)

                await channel.default_exchange.publish(
                    aio_pika.Message(body=json.dumps(message).encode()),
                    routing_key=queue_name,
                )
            logger.info(f"Successfully published event to RabbitMQ queue '{queue_name}'")
        except Exception as e:
            logger.error(f"Failed to publish event to RabbitMQ queue '{queue_name}': {e}", exc_info=True)