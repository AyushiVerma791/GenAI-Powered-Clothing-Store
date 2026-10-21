import os
import uuid
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings
from app.core.logging import logger

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Magic bytes signatures for robust type validation
MAGIC_SIGNATURES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",
}

class StorageService:
    @staticmethod
    def _validate_image(file: UploadFile, header_bytes: bytes, file_size: int):
        # 1. Check extension
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        # 2. Check content-type header
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported media type '{file.content_type}'.",
            )

        # 3. Check magic bytes
        matches_magic = False
        for magic in MAGIC_SIGNATURES:
            if header_bytes.startswith(magic):
                matches_magic = True
                break
        if not matches_magic and ext != ".webp":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content signature does not match a valid image.",
            )

        # 4. Check file size
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
            )

    @staticmethod
    async def upload_file(file: UploadFile) -> str:
        """Uploads an image file to either local disk or Amazon S3 and returns the accessible URL."""
        contents = await file.read()
        file_size = len(contents)
        header_bytes = contents[:16]

        StorageService._validate_image(file, header_bytes, file_size)

        ext = os.path.splitext(file.filename or "")[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"

        # If AWS S3 backend is configured
        if settings.STORAGE_BACKEND == "s3" and settings.S3_BUCKET_NAME and settings.AWS_ACCESS_KEY_ID:
            try:
                s3_client = boto3.client(
                    "s3",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
                key = f"products/{filename}"
                s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=key,
                    Body=contents,
                    ContentType=file.content_type,
                )

                if settings.CLOUDFRONT_DOMAIN:
                    return f"https://{settings.CLOUDFRONT_DOMAIN}/{key}"
                return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            except ClientError as e:
                logger.error("AWS S3 upload failed: %s. Falling back to local storage.", e)

        # Default: Local disk storage
        upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", settings.UPLOAD_DIR))
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)

        with open(file_path, "wb") as f:
            f.write(contents)

        logger.info("Saved product image locally: %s", file_path)
        return f"/uploads/{filename}"
