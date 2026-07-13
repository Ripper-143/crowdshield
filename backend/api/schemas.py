"""Pydantic v2 schemas for CrowdShield API."""
from typing import Dict, List, Optional
from pydantic import BaseModel


class ZoneRisk(BaseModel):
    zone_id: str
    zone_name: str
    fruin_level: str          # A–F
    risk_score: int           # 0–100
    severity: str             # NORMAL | WATCH | WARNING | CRITICAL | EVACUATE
    color: str
    density: float
    forecast_density: float
    time_to_critical: Optional[str] = None
    alert_message: str
    recommended_action: str
    updated_at: Optional[str] = None


class AllZonesRisk(BaseModel):
    zones: Dict[str, ZoneRisk]
    overall_severity: str
    total_agents: int
    sim_time: float
    timestamp: str


class DensityPoint(BaseModel):
    ts: str
    density: float
    people_count: int
    inflow_rate: float
    outflow_rate: float


class ForecastPoint(BaseModel):
    tick: int
    forecast_density: float
    lower_bound: float
    upper_bound: float


class ZoneHistory(BaseModel):
    zone_id: str
    zone_name: str
    readings: List[DensityPoint]
    forecast: List[ForecastPoint]
    current_fruin_level: str
    current_risk_score: int


class SimulateTickResponse(BaseModel):
    tick: int
    sim_time: float
    zones: Dict[str, ZoneRisk]
    overall_severity: str
    high_priority_alerts: List[ZoneRisk]


class HistoricalIncidentSchema(BaseModel):
    id: int
    name: str
    date: str
    location: str
    deaths: int
    estimated_peak_density: float
    density_timeline: List[float]
    density_values: List[float]
    fruin_breach_minute: int
    early_warning_possible_minute: int


class SimStatus(BaseModel):
    running: bool
    tick: int
    sim_time: float
    total_agents: int
