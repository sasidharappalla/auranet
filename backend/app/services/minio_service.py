"""MinIO S3-compatible object storage service."""

import uuid
from io import BytesIO

from minio import Minio
from fastapi import UploadFile

from app.config import settings

client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=settings.minio_secure,
)


async def upload_image(file: UploadFile) -> str:
    """Upload an image to MinIO and return its public URL."""
    ext = file.filename.split(".")[-1] if file.filename else "jpg"
    object_name = f"posts/{uuid.uuid4()}.{ext}"
    data = await file.read()

    client.put_object(
        bucket_name=settings.minio_bucket,
        object_name=object_name,
        data=BytesIO(data),
        length=len(data),
        content_type=file.content_type or "image/jpeg",
    )

    # Return the public URL (accessible because we set anonymous download on the bucket)
    return f"{settings.minio_public_url}/{settings.minio_bucket}/{object_name}"
