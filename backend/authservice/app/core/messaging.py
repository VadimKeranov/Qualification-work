import json
import aio_pika
import logging

# Настраиваем базовый логгер, чтобы видеть сообщения в консоли
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

class EventProducer:
    """
    Инкапсулирует всю логику для отправки сообщений в RabbitMQ.
    """
    @staticmethod
    async def _publish_message(queue_name: str, message_body: dict):
        """
        Приватный метод для подключения и отправки сообщения в указанную очередь.
        """
        try:
            # Устанавливаем соединение
            connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/")
            async with connection:
                # Создаем канал
                channel = await connection.channel()
                # Гарантируем, что очередь существует и она долговечна (durable=True)
                await channel.declare_queue(queue_name, durable=True)

                # Публикуем сообщение
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(message_body).encode(),
                        delivery_mode=aio_pika.DeliveryMode.PERSISTENT # Гарантия сохранения на диск
                    ),
                    routing_key=queue_name
                )
            log.info(f"Сообщение успешно отправлено в очередь '{queue_name}': {message_body}")
        except Exception as e:
            # В случае ошибки логируем ее, а не просто печатаем
            log.error(f"Ошибка RabbitMQ при отправке в очередь '{queue_name}': {e}")

    @staticmethod
    async def publish_user_created(user_id: int, role: str):
        """
        Публикует событие о создании нового пользователя.
        """
        await EventProducer._publish_message(
            "user_created_queue",
            {"id": user_id, "role": role}
        )

    @staticmethod
    async def publish_user_deleted(user_id: int):
        """
        Публикует событие об удалении пользователя.
        """
        await EventProducer._publish_message(
            "user_deleted_queue",
            {"user_id": user_id}
        )
