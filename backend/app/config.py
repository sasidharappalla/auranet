"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://auranet:auranet_secret@db:5432/auranet"

    # MinIO
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin123"
    minio_bucket: str = "auranet-media"
    minio_secure: bool = False
    minio_public_url: str = "http://localhost:9002"  # External URL for images

    # RabbitMQ
    rabbitmq_url: str = "amqp://auranet:auranet_secret@rabbitmq:5672/"

    # JWT
    jwt_secret: str = "change-me-in-production-use-a-real-secret"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440

    class Config:
        env_file = ".env"


settings = Settings()
