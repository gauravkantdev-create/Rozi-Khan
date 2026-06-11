import os
from fastapi import FastAPI, Request, Response, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine
from app.routers import auth, products, orders, upload, payment, supplier, retailer, retailer_listing, inventory, integration, webhooks, analytics

app = FastAPI(
    title="Rozi Khan API",
    description="Python FastAPI + SQLite backend for Rozi Khan dropshipping platform",
    version="1.0.0"
)

# Create database tables
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration matching Express app
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "https://rozi-khan.vercel.app",
    "https://rozi-khan.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r".*\.(vercel\.app|onrender\.com)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def static_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/uploads"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response

# Serve static uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from app.routers import auth, products, orders, upload, payment, supplier, retailer, retailer_listing, inventory, integration, webhooks, analytics, legacy

# Include APIRouters under /api prefix
app.include_router(legacy.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(supplier.router, prefix="/api")
app.include_router(retailer.router, prefix="/api")
app.include_router(retailer_listing.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(integration.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

# Test / Health Route
@app.get("/")
def health_check():
    return {
        "success": True,
        "message": "RoziKhan API is running successfully 🚀"
    }

# Global Request Validation Exception Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"[validation] request parameter error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": "Validation Error",
            "details": exc.errors()
        }
    )

# Global Error Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_trace = traceback.format_exc()
    print(f"[GLOBAL ERROR] {error_trace}", flush=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": str(exc) if settings.NODE_ENV != "production" else "Internal Server Error",
            "error_trace": error_trace if settings.NODE_ENV == "development" else None
        }
    )
