from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base
from app.models import User, Vehicle, Trip  # Import all models to ensure they are registered
from app.routers import vehicles, routes, trips, auth

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting up application...")
    try:
        logger.info("Ensuring database tables exist...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.exception(
            "Database connection failed at startup. App will start but DB-dependent routes will fail. "
            "Check DATABASE_URL (e.g. Supabase: host, port, sslmode=require), network access, and credentials: %s",
            e,
        )
    yield
    # Shutdown
    logger.info("Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title="Route Planner and Travel Cost Estimator",
    description="A production-ready backend API for calculating travel routes, fuel consumption, and trip costs using Google Maps Directions API.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS (split frontend on Vercel needs explicit origins when using credentials)
def _cors_allow_origins():
    raw = settings.cors_origins
    if raw:
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        # Never allow "*" with allow_credentials=True (browsers will fail and middleware won't emit ACAO).
        origins = [o for o in origins if o != "*"]
        if origins:
            return origins
    # IMPORTANT:
    # With allow_credentials=True, using allow_origins=["*"] will not work in browsers
    # (the middleware won't emit Access-Control-Allow-Origin for credentialed requests).
    # For a safe default dev/prod experience, fall back to known frontend origins.
    return [
        # Vercel (preview / project domain)
        "https://travel-cost-estimoator-c8tg-7oq2ue0ib-archila99s-projects.vercel.app",
        # Vercel (production domain - spelling variants seen in deploys)
        "https://travel-cost-estimoator.vercel.app",
        # Vercel (production domain)
        "https://travel-cost-estimator.vercel.app",
        # Local dev
        "http://localhost:5173",
        "http://localhost:3000",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_allow_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(routes.router, prefix="/api")
app.include_router(trips.router, prefix="/api")

# Mount static files (after API routes)
from fastapi.staticfiles import StaticFiles
import os

# Check if static directory exists (it will in the Docker container)
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    
    # Serve index.html for root and SPA routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to pass through if they weren't caught above (though strictly they should be)
        if full_path.startswith("api/"):
             return JSONResponse(status_code=404, content={"detail": "Not found"})
        return FileResponse("static/index.html")

from fastapi.responses import FileResponse





@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "route-planner-api"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred",
            "error": str(exc)
        }
    )
