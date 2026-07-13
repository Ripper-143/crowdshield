"""
Database connection management for CrowdShield.
Supports SQLite (local dev) and PostgreSQL+TimescaleDB (production).
"""
import os
import json
from datetime import datetime
from typing import Generator, List, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import (
    Base, Venue, ZoneModel, HistoricalIncident,
    DensityReading, RiskScore
)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crowdshield.db")

# SQLite requires check_same_thread=False for FastAPI async
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a DB session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed initial venue data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Venue).count() > 0:
            return  # Already seeded
        _seed_data(db)
    finally:
        db.close()


def _seed_data(db: Session):
    """Seed Kumbh Mela venue, zones, and historical incidents."""
    # Create venue
    venue = Venue(
        name="Kumbh Mela Ghat Section",
        location="Prayagraj, Uttar Pradesh, India",
        total_area_m2=2940.0,
        venue_type="religious_gathering"
    )
    db.add(venue)
    db.flush()

    # Import zone definitions from simulator
    from ..simulator.venue import VENUE as sim_venue
    for z in sim_venue["zones"]:
        zone = ZoneModel(
            id=z.id,
            venue_id=venue.id,
            name=z.name,
            zone_type=z.zone_type,
            area_m2=z.area_m2,
            gate_width_m=z.gate_width,
            max_capacity=z.capacity,
            x=z.x, y=z.y,
            width=z.width, height=z.height
        )
        db.add(zone)

    # Load historical incidents from JSON
    data_path = os.path.join(
        os.path.dirname(__file__), "../../data/historical_incidents.json"
    )
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            incidents_data = json.load(f)
        for inc in incidents_data["incidents"]:
            incident = HistoricalIncident(
                venue_id=venue.id,
                name=inc["name"],
                incident_date=datetime.strptime(inc["date"], "%Y-%m-%d"),
                location=inc["location"],
                deaths=inc["deaths"],
                injuries=inc.get("injuries", 0),
                estimated_crowd=inc.get("estimated_crowd", 0),
                estimated_peak_density=inc["estimated_peak_density"],
                bottleneck_description=inc.get("bottleneck"),
                source=inc.get("source"),
                fruin_breach_minute=inc.get("fruin_breach_minute"),
                early_warning_possible_minute=inc.get("early_warning_possible_minute")
            )
            db.add(incident)

    db.commit()


# ------------------------------------------------------------------
# Data access helpers
# ------------------------------------------------------------------

def save_density_reading(
    db: Session, zone_id: str, stats: dict, ts: datetime
) -> DensityReading:
    reading = DensityReading(
        zone_id=zone_id,
        ts=ts,
        people_count=stats.get("people_count", 0),
        density=stats.get("density", 0.0),
        inflow_rate=stats.get("inflow_rate", 0.0),
        outflow_rate=stats.get("outflow_rate", 0.0),
        avg_speed=stats.get("avg_speed", 0.0),
    )
    db.add(reading)
    db.commit()
    return reading


def save_risk_score(
    db: Session, zone_id: str, risk: dict, ts: datetime
) -> RiskScore:
    score = RiskScore(
        zone_id=zone_id,
        ts=ts,
        fruin_level=risk.get("fruin_level", "A"),
        risk_score=risk.get("risk_score", 0),
        predicted_peak_density=risk.get("predicted_peak_density"),
        predicted_peak_time_seconds=risk.get("predicted_peak_time_seconds"),
        confidence=risk.get("confidence", 0.8),
        alert_message=risk.get("alert_message"),
        recommended_action=risk.get("recommended_action"),
    )
    db.add(score)
    db.commit()
    return score


def get_zone_history(
    db: Session, zone_id: str, limit: int = 120
) -> List[DensityReading]:
    return (
        db.query(DensityReading)
        .filter(DensityReading.zone_id == zone_id)
        .order_by(DensityReading.ts.desc())
        .limit(limit)
        .all()
    )


def get_historical_incidents(db: Session) -> List[HistoricalIncident]:
    return db.query(HistoricalIncident).all()
