"""CrowdShield FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router
from ..db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: init DB on startup, cleanup on shutdown."""
    init_db()
    yield
    from ..db.redis_store import set_sim_running
    set_sim_running(False)


app = FastAPI(
    title="CrowdShield API",
    description=(
        "Real-Time Stampede & Crowd-Crush Risk Prediction for Mass Gatherings. "
        "Powered by Social Force Model simulation and Fruin's Level-of-Service physics."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {
        "service": "CrowdShield",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "description": "Real-time crowd-crush risk prediction — Fruin LoS + Social Force Model",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
