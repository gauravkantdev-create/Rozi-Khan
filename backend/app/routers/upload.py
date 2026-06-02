import os
import time
import shutil
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Request, Response, status
from app.middleware.auth import AuthorizeRoles

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
        # Save file to disk
        with open(filepath, "wb") as f:
            f.write(contents)
            
        # Construct URL to access the uploaded file
        base_url = str(request.base_url)
        if base_url.endswith("/"):
            base_url = base_url[:-1]
            
        # Keep path as /api prefix or directly root level.
        # Since static folder is mounted at /uploads, we point to base_url/uploads/filename
        image_url = f"{base_url}/uploads/{filename}"
        
        return {
            "success": True,
            "message": "Image uploaded successfully",
            "url": image_url
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
