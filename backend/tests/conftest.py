import os

TEST_ENV = {
    "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/auranet_test",
    "MINIO_ACCESS_KEY": "test-minio-user",
    "MINIO_SECRET_KEY": "test-minio-secret",
    "RABBITMQ_URL": "amqp://test:test@localhost:5672/",
    "JWT_SECRET": "test-jwt-secret-with-sufficient-length",
}

for name, value in TEST_ENV.items():
    os.environ.setdefault(name, value)
