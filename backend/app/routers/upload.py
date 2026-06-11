import os
import time
import shutil
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Request, Response, status
from fastapi.staticfiles import StaticFiles
from app.middleware.auth import AuthorizeRoles
try:
    from app.utils.cloudinary import upload_image_to_cloudinary
except Exception:
    upload_image_to_cloudinary = None

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", status_code=status.HTTP_200_OK)
async def upload_image(
    request: Request,
    response: Response,
    image: UploadFile = File(...),
    current_user = Depends(AuthorizeRoles("admin", "supplier"))
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
    contents = await image.read()
    if len(contents) > 5 * 1024 * 1024:
         raise HTTPException(
            status_code=400,
            detail="File size exceeds the 5MB limit."
        )
    
    # Generate unique filename
    ext = os.path.splitext(image.filename)[1] if image.filename else ".png"
    filename = f"image-{int(time.time() * 1000)}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    image_url = None
    
    # Try Cloudinary first
    if upload_image_to_cloudinary:
        try:
            upload_result = upload_image_to_cloudinary(contents, filename)
            image_url = upload_result.get("secure_url")
        except Exception:
            pass  # Fall through to local upload
    
    # Fallback to local file system
    if not image_url:
        try:
            with open(filepath, "wb") as buffer:
                buffer.write(contents)
            # Create local URL (assuming /uploads is served statically)
            base_url = str(request.base_url).rstrip("/")
            image_url = f"{base_url}/uploads/{filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Local upload failed: {str(e)}")
    
    return {
        "success": True,
        "message": "Image uploaded successfully",
        "url": image_url,
    }
