from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.database import engine, Base
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
    logger.info("Database tables will be created by Alembic migrations")
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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(routes.router)
app.include_router(trips.router)


@app.get("/", tags=["root"])
def read_root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to Route Planner and Travel Cost Estimator API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


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
