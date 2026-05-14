import aio_pika
import json
from app.config import settings

class EventPublisher:
    @staticmethod
    async def publish(queue_name: str, message: dict):
        """Публикует сообщение в указанную очередь RabbitMQ."""
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            await channel.declare_queue(queue_name, durable=True)
            
            await channel.default_exchange.publish(
                aio_pika.Message(body=json.dumps(message).encode()),
                routing_key=queue_name,
            )
