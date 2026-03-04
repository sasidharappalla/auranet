"""RabbitMQ message publishing service."""

import json
import pika
from app.config import settings

QUEUE_NAME = "post_created"


def publish_post_created(post_id: str, image_url: str) -> None:
    """Publish a message to the post_created queue for the AI worker to consume."""
    connection = pika.BlockingConnection(pika.URLParameters(settings.rabbitmq_url))
    channel = connection.channel()

    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    message = json.dumps({
        "post_id": post_id,
        "image_url": image_url,
    })

    channel.basic_publish(
        exchange="",
        routing_key=QUEUE_NAME,
        body=message,
        properties=pika.BasicProperties(delivery_mode=2),  # persistent
    )

    connection.close()
