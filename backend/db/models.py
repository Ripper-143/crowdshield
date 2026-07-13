"""SQLAlchemy ORM models for CrowdShield. PostgreSQL + TimescaleDB schema."""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, Float, String, DateTime, ForeignKey,
    Text, Boolean, CheckConstraint, Index
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    location = Column(String(300), nullable=False)
    total_area_m2 = Column(Float, nullable=False)
    venue_type = Column(String(50), nullable=False, default="religious_gathering")
    created_at = Column(DateTime, default=datetime.utcnow)

    zones = relationship("ZoneModel", back_populates="venue")
    incidents = relationship("HistoricalIncident", back_populates="venue")


class ZoneModel(Base):
    __tablename__ = "zones"

    id = Column(String(50), primary_key=True)   # e.g. 'gate_a'
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    name = Column(String(200), nullable=False)
    zone_type = Column(String(50), nullable=False)
    area_m2 = Column(Float, nullable=False)
    gate_width_m = Column(Float, default=0.0)
    max_capacity = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)

    __table_args__ = (
        CheckConstraint("area_m2 > 0", name="check_area_positive"),
        CheckConstraint("max_capacity > 0", name="check_capacity_positive"),
    )

    venue = relationship("Venue", back_populates="zones")


class HistoricalIncident(Base):
    __tablename__ = "historical_incidents"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    name = Column(String(300), nullable=False)
    incident_date = Column(DateTime, nullable=False)
    location = Column(String(300), nullable=False)
    deaths = Column(Integer, nullable=False)
    injuries = Column(Integer, default=0)
    estimated_crowd = Column(Integer, default=0)
    estimated_peak_density = Column(Float, nullable=False)
    bottleneck_description = Column(Text)
    source = Column(Text)
    fruin_breach_minute = Column(Integer)
    early_warning_possible_minute = Column(Integer)

    __table_args__ = (
        CheckConstraint("deaths >= 0", name="check_deaths_nonneg"),
        CheckConstraint("estimated_peak_density >= 0", name="check_peak_density_nonneg"),
    )

    venue = relationship("Venue", back_populates="incidents")


class DensityReading(Base):
    """
    Time-series density readings per zone.
    In production: TimescaleDB hypertable on 'ts' for efficient range queries.
    Rate-of-change of density (dρ/dt) is the key crush predictor.
    """
    __tablename__ = "density_readings"

    id = Column(Integer, primary_key=True)
    zone_id = Column(String(50), ForeignKey("zones.id"), nullable=False)
    ts = Column(DateTime, nullable=False)
    people_count = Column(Integer, nullable=False)
    density = Column(Float, nullable=False)        # people/m²
    inflow_rate = Column(Float, default=0.0)       # people/min entering
    outflow_rate = Column(Float, default=0.0)      # people/min leaving
    avg_speed = Column(Float, default=0.0)         # m/s

    __table_args__ = (
        CheckConstraint("density >= 0", name="check_density_nonneg_r"),
        CheckConstraint("density <= 12", name="check_density_physical_max_r"),
        CheckConstraint("people_count >= 0", name="check_count_nonneg_r"),
        Index("ix_density_readings_zone_ts", "zone_id", "ts"),
    )


class RiskScore(Base):
    """
    Predicted risk scores per zone.
    In production: TimescaleDB hypertable on 'ts'.
    """
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True)
    zone_id = Column(String(50), ForeignKey("zones.id"), nullable=False)
    ts = Column(DateTime, nullable=False)
    fruin_level = Column(String(1), nullable=False)   # A–F
    risk_score = Column(Integer, nullable=False)       # 0–100
    predicted_peak_density = Column(Float)
    predicted_peak_time_seconds = Column(Float)
    confidence = Column(Float, default=0.8)
    alert_message = Column(Text)
    recommended_action = Column(Text)

    __table_args__ = (
        CheckConstraint("risk_score >= 0 AND risk_score <= 100", name="check_risk_score_range"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="check_confidence_range"),
        Index("ix_risk_scores_zone_ts", "zone_id", "ts"),
    )
