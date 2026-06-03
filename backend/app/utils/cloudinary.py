import os
from cloudinary.uploader import upload
from cloudinary.utils import cloudinary_url
from dotenv import load_dotenv

load_dotenv()

CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
API_KEY = os.getenv("CLOUDINARY_API_KEY")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET")
UPLOAD_FOLDER = os.getenv("CLOUDINARY_UPLOAD_FOLDER", "")

def upload_image_to_cloudinary(file_bytes: bytes, filename: str) -> dict:
    """Upload an image to Cloudinary.

    Args:
        file_bytes: Raw image bytes.
        filename: Original filename (used for public_id).
    Returns:
        The response dictionary from Cloudinary containing at least ``secure_url``.
    """
    # Construct a public_id that includes the optional folder path
    public_id = f"{UPLOAD_FOLDER}/{os.path.splitext(filename)[0]}" if UPLOAD_FOLDER else os.path.splitext(filename)[0]
    result = upload(
        file_bytes,
        public_id=public_id,
        resource_type="image",
        overwrite=True,
        notification_url=None,
    )
    return result
