import os
import time
# import shutil  # No longer needed for Cloudinary uploads
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Request, Response, status
from app.middleware.auth import AuthorizeRoles
from app.utils.cloudinary import upload_image_to_cloudinary

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", status_code=status.HTTP_200_OK)
async def upload_image(
    request: Request,
    response: Response,
    image: UploadFile = File(...),
    current_user = Depends(AuthorizeRoles("admin"))
):
    # Ensure response headers allow cross-origin
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    
    # Validate MIME type
    if not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )
        
    # File size validation (5MB limit)
    # Read the file contents to check size
    contents = await image.read()
    if len(contents) > 5 * 1024 * 1024:
         raise HTTPException(
            status_code=400,
            detail="File size exceeds the 5MB limit."
        )
    # Reset read pointer
    await image.seek(0)
    
    # Generate unique filename
    ext = os.path.splitext(image.filename)[1]
    filename = f"image-{int(time.time() * 1000)}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        # Upload image to Cloudinary
        upload_result = upload_image_to_cloudinary(contents, filename)
        image_url = upload_result.get("secure_url")
        if not image_url:
            raise HTTPException(status_code=500, detail="Cloudinary upload failed")
        return {
            "success": True,
            "message": "Image uploaded successfully",
            "url": image_url,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
