"""
AuraNet Async AI Worker

Standalone process that:
1. Listens to the 'post_created' RabbitMQ queue
2. Downloads the image from MinIO
3. Sends it to a Vision LLM (or mock) for aura scoring
4. Updates the post's ai_roast column in PostgreSQL
5. Acknowledges the message

Currently uses a MOCK provider. Swap in OpenAI/Groq by changing the
analyze_image() function.
"""

import json
import os
import random
import time

import pika
import psycopg2
from minio import Minio

# ── Configuration ──────────────────────────────────────────

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://auranet:auranet_secret@rabbitmq:5672/")
QUEUE_NAME = "post_created"

DB_DSN = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://auranet:auranet_secret@db:5432/auranet"
).replace("postgresql+asyncpg://", "postgresql://")

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "auranet-media")

AI_PROVIDER = os.getenv("AI_PROVIDER", "mock")

# ── MinIO Client ───────────────────────────────────────────

minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False,
)

# ── Mock AI Analysis ───────────────────────────────────────

ROASTS = [
    "This setup screams 'I have good taste but bad posture.'",
    "The vibes are immaculate but the cable management is criminal.",
    "10/10 aura if you squint hard enough.",
    "This radiates 'peaked in 2024' energy.",
    "Giving main character energy but the plot is mid.",
    "The aesthetic is trying really hard and honestly? It's working.",
    "This has 'I googled minimalism once' vibes.",
    "Bold. Chaotic. Unhinged. I respect it.",
    "Certified cozy. Would doom-scroll here.",
    "This image has more personality than most people I know.",
]


def analyze_image_mock(image_data: bytes) -> dict:
    """Mock AI analysis that returns a random aura score and roast."""
    time.sleep(random.uniform(0.5, 2.0))  # Simulate inference latency
    return {
        "aura_score": random.randint(15, 99),
        "roast": random.choice(ROASTS),
        "tags": random.sample(
            ["cozy", "chaotic", "minimalist", "maximalist", "retro", "futuristic",
             "cottagecore", "cyberpunk", "clean", "unhinged", "aesthetic", "mid"],
            k=random.randint(2, 4),
        ),
        "provider": "mock",
    }


def analyze_image(image_data: bytes) -> dict:
    """
    Route to the configured AI provider.
    Swap this out for OpenAI GPT-4 Vision, Groq, or a local HF model.
    """
    if AI_PROVIDER == "mock":
        return analyze_image_mock(image_data)

    # TODO: Add real LLM providers here
    # elif AI_PROVIDER == "openai":
    #     return analyze_image_openai(image_data)
    # elif AI_PROVIDER == "groq":
    #     return analyze_image_groq(image_data)

    return analyze_image_mock(image_data)


# ── Database Update ────────────────────────────────────────

def set_ai_status(post_id: str, status: str):
    """Set the ai_status field on a post."""
    conn = psycopg2.connect(DB_DSN)
    try:
        cur = conn.cursor()
        cur.execute("UPDATE posts SET ai_status = %s WHERE id = %s", (status, post_id))
        conn.commit()
        cur.close()
    finally:
        conn.close()


def update_post_ai_roast(post_id: str, ai_roast: dict):
    """Update the post's ai_roast column and set ai_status to completed."""
    conn = psycopg2.connect(DB_DSN)
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE posts SET ai_roast = %s, ai_status = 'completed' WHERE id = %s",
            (json.dumps(ai_roast), post_id),
        )
        conn.commit()
        cur.close()
        print(f"  ✅ Updated post {post_id} with aura_score={ai_roast['aura_score']}")
    finally:
        conn.close()


# ── Download Image from MinIO ──────────────────────────────

def download_image(image_url: str) -> bytes:
    """Download image bytes from MinIO given the public URL."""
    # Extract the object path from the URL
    # URL format: http://localhost:9000/auranet-media/posts/uuid.ext
    parts = image_url.split(f"/{MINIO_BUCKET}/")
    if len(parts) < 2:
        raise ValueError(f"Cannot parse MinIO object path from URL: {image_url}")

    object_name = parts[1]
    response = minio_client.get_object(MINIO_BUCKET, object_name)
    data = response.read()
    response.close()
    response.release_conn()
    return data


# ── RabbitMQ Consumer ──────────────────────────────────────

def on_message(channel, method, properties, body):
    """Callback for each message from the post_created queue."""
    try:
        message = json.loads(body)
        post_id = message["post_id"]
        image_url = message["image_url"]

        print(f"📨 Received job for post {post_id}")

        # Step 0: Set status to processing
        set_ai_status(post_id, "processing")

        # Step 1: Download image from MinIO
        print(f"  ⬇️  Downloading image...")
        image_data = download_image(image_url)

        # Step 2: Analyze with AI
        print(f"  🤖 Analyzing image...")
        ai_result = analyze_image(image_data)

        # Step 3: Update PostgreSQL
        print(f"  💾 Saving results...")
        update_post_ai_roast(post_id, ai_result)

        # Step 4: Acknowledge the message
        channel.basic_ack(delivery_tag=method.delivery_tag)
        print(f"  ✨ Job complete for post {post_id}\n")

    except Exception as e:
        print(f"  ❌ Error processing message: {e}")
        # Try to set status to failed
        try:
            message = json.loads(body)
            set_ai_status(message.get("post_id", ""), "failed")
        except Exception:
            pass
        # Negative acknowledge — requeue for retry
        channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    """Connect to RabbitMQ and start consuming messages."""
    print("🔌 AI Worker starting up...")
    print(f"   Provider: {AI_PROVIDER}")
    print(f"   Queue: {QUEUE_NAME}")

    # Retry connection (RabbitMQ may not be ready immediately)
    for attempt in range(10):
        try:
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            break
        except pika.exceptions.AMQPConnectionError:
            print(f"   Waiting for RabbitMQ... (attempt {attempt + 1}/10)")
            time.sleep(3)
    else:
        print("❌ Could not connect to RabbitMQ after 10 attempts")
        return

    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message)

    print(f"👂 Listening for messages on '{QUEUE_NAME}' queue...\n")
    channel.start_consuming()


if __name__ == "__main__":
    main()
