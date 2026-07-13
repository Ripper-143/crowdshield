"""
FastAPI routes for CrowdShield.
REST endpoints + WebSocket live feed.
"""
import asyncio
import json
import os
from datetime import datetime
from typing import List, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import (
    get_db, get_zone_history as db_get_zone_history,
    save_density_reading, save_risk_score, SessionLocal
)
from ..db.redis_store import (
    get_all_zone_risks, get_zone_risk, set_zone_risk,
    set_sim_running, get_sim_running
)
from ..simulator.generator import get_generator
from ..simulator.venue import ZONE_MAP
from ..agents.pipeline import run_pipeline
from ..agents.flow_prediction import _smoothed, _trend, forecast_density, reset_state
from .schemas import (
    AllZonesRisk, ZoneHistory, DensityPoint, ForecastPoint,
    SimulateTickResponse, HistoricalIncidentSchema, SimStatus, ZoneRisk
)

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for broadcast push."""

    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
_last_result: dict = {}


def _build_zone_risk(zone_id: str, alert: dict) -> ZoneRisk:
    """Convert raw alert dict to ZoneRisk schema."""
    return ZoneRisk(
        zone_id=zone_id,
        zone_name=alert.get("zone_name", zone_id),
        fruin_level=alert.get("fruin_level", "A"),
        risk_score=alert.get("risk_score", 0),
        severity=alert.get("severity", "NORMAL"),
        color=alert.get("color", "#22c55e"),
        density=alert.get("density", 0.0),
        forecast_density=alert.get("forecast_density", 0.0),
        time_to_critical=alert.get("time_to_critical"),
        alert_message=alert.get("alert_message", ""),
        recommended_action=alert.get("recommended_action", "Monitor zone."),
        updated_at=alert.get("generated_at"),
    )


# ------------------------------------------------------------------
# REST Endpoints
# ------------------------------------------------------------------

@router.get("/venue/zones/risk", response_model=AllZonesRisk)
async def get_all_zones_risk():
    """Get current Fruin risk level for all zones from Redis cache."""
    gen = get_generator()
    risks = get_all_zone_risks()

    zone_risks: Dict[str, ZoneRisk] = {}
    for zone_id, risk in risks.items():
        try:
            zone_risks[zone_id] = _build_zone_risk(zone_id, risk)
        except Exception:
            pass

    max_score = max((r.get("risk_score", 0) for r in risks.values()), default=0)
    overall = "NORMAL"
    for threshold, sev in [(40, "WATCH"), (60, "WARNING"), (80, "CRITICAL"), (100, "EVACUATE")]:
        if max_score >= threshold:
            overall = sev

    return AllZonesRisk(
        zones=zone_risks,
        overall_severity=overall,
        total_agents=_last_result.get("total_agents", 0),
        sim_time=gen.sim_time_seconds,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/zone/{zone_id}/history", response_model=ZoneHistory)
async def get_zone_history(zone_id: str, limit: int = 60, db: Session = Depends(get_db)):
    """Get historical density readings + forecast for a zone."""
    if zone_id not in ZONE_MAP:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")

    db_readings = db_get_zone_history(db, zone_id, limit)
    db_readings.reverse()  # chronological order

    readings = [
        DensityPoint(
            ts=r.ts.isoformat(),
            density=r.density,
            people_count=r.people_count,
            inflow_rate=r.inflow_rate,
            outflow_rate=r.outflow_rate,
        )
        for r in db_readings
    ]

    # Build forecast from current smoothing state
    level = _smoothed.get(zone_id, 0.0)
    trend = _trend.get(zone_id, 0.0)
    forecast_pts = []
    for h in range(1, 11):
        fc = max(0.0, level + h * trend)
        ci = max(0.05, fc * 0.15)
        forecast_pts.append(ForecastPoint(
            tick=h,
            forecast_density=round(fc, 3),
            lower_bound=round(max(0.0, fc - ci), 3),
            upper_bound=round(fc + ci, 3),
        ))

    risk = get_zone_risk(zone_id) or {}
    return ZoneHistory(
        zone_id=zone_id,
        zone_name=ZONE_MAP[zone_id].name,
        readings=readings,
        forecast=forecast_pts,
        current_fruin_level=risk.get("fruin_level", "A"),
        current_risk_score=risk.get("risk_score", 0),
    )


@router.post("/simulate/tick", response_model=SimulateTickResponse)
async def simulate_tick(db: Session = Depends(get_db)):
    """Advance simulator one tick and run the full agent pipeline."""
    gen = get_generator()
    raw_stats = gen.step()
    ts = datetime.utcnow()

    result = run_pipeline(raw_stats, gen.sim_time_seconds)
    global _last_result
    _last_result = result

    # Persist readings
    for zone_id, stats in raw_stats.items():
        try:
            save_density_reading(db, zone_id, stats, ts)
        except Exception:
            pass

    # Cache risk scores and persist
    alerts = result.get("alerts", {})
    for zone_id, alert in alerts.items():
        set_zone_risk(zone_id, alert)
        risk_data = result.get("risk_classifications", {}).get(zone_id, {})
        if risk_data:
            try:
                save_risk_score(db, zone_id, {
                    **risk_data,
                    "alert_message": alert.get("alert_message"),
                    "recommended_action": alert.get("recommended_action"),
                    "predicted_peak_density": risk_data.get("forecast_density"),
                    "predicted_peak_time_seconds": risk_data.get("time_to_f_level_seconds"),
                }, ts)
            except Exception:
                pass

    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "tick",
        "tick": gen.tick,
        "sim_time": gen.sim_time_seconds,
        "alerts": alerts,
        "overall_severity": result.get("overall_severity", "NORMAL"),
        "total_agents": result.get("total_agents", 0),
    })

    zone_risks = {zid: _build_zone_risk(zid, a) for zid, a in alerts.items()}
    hp = [zone_risks[a["zone_id"]] for a in result.get("high_priority_alerts", []) if a["zone_id"] in zone_risks]

    return SimulateTickResponse(
        tick=gen.tick,
        sim_time=gen.sim_time_seconds,
        zones=zone_risks,
        overall_severity=result.get("overall_severity", "NORMAL"),
        high_priority_alerts=hp,
    )


@router.post("/simulate/start")
async def simulate_start():
    """Start the auto-simulation loop (background asyncio task)."""
    gen = get_generator()
    if get_sim_running():
        return {"status": "already_running", "tick": gen.tick}

    set_sim_running(True)

    async def _loop():
        db = SessionLocal()
        try:
            while get_sim_running():
                raw_stats = gen.step()
                ts = datetime.utcnow()
                result = run_pipeline(raw_stats, gen.sim_time_seconds)
                global _last_result
                _last_result = result
                alerts = result.get("alerts", {})
                for zone_id, alert in alerts.items():
                    set_zone_risk(zone_id, alert)
                    try:
                        save_density_reading(db, zone_id, raw_stats.get(zone_id, {}), ts)
                    except Exception:
                        pass
                await manager.broadcast({
                    "type": "tick",
                    "tick": gen.tick,
                    "sim_time": gen.sim_time_seconds,
                    "alerts": alerts,
                    "overall_severity": result.get("overall_severity", "NORMAL"),
                    "total_agents": result.get("total_agents", 0),
                })
                await asyncio.sleep(1.0)
        finally:
            db.close()

    asyncio.create_task(_loop())
    return {"status": "started"}


@router.post("/simulate/stop")
async def simulate_stop():
    """Stop the auto-simulation loop."""
    set_sim_running(False)
    gen = get_generator()
    return {"status": "stopped", "tick": gen.tick}


@router.post("/simulate/reset")
async def simulate_reset():
    """Reset simulation and all state to t=0."""
    set_sim_running(False)
    get_generator().reset()
    reset_state()  # clear flow prediction history
    return {"status": "reset"}


@router.get("/simulate/status", response_model=SimStatus)
async def simulate_status():
    gen = get_generator()
    return SimStatus(
        running=get_sim_running(),
        tick=gen.tick,
        sim_time=gen.sim_time_seconds,
        total_agents=_last_result.get("total_agents", 0),
    )


@router.get("/incidents", response_model=List[HistoricalIncidentSchema])
async def get_incidents():
    """Get historical stampede incidents for backtest replay."""
    data_path = os.path.join(
        os.path.dirname(__file__), "../../../data/historical_incidents.json"
    )
    if not os.path.exists(data_path):
        return []
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return [
        HistoricalIncidentSchema(
            id=inc["id"],
            name=inc["name"],
            date=inc["date"],
            location=inc["location"],
            deaths=inc["deaths"],
            estimated_peak_density=inc["estimated_peak_density"],
            density_timeline=inc["density_timeline_minutes"],
            density_values=inc["density_values"],
            fruin_breach_minute=inc["fruin_breach_minute"],
            early_warning_possible_minute=inc["early_warning_possible_minute"],
        )
        for inc in data["incidents"]
    ]


# ------------------------------------------------------------------
# WebSocket
# ------------------------------------------------------------------

@router.websocket("/ws/live-feed")
async def websocket_live_feed(websocket: WebSocket):
    """WebSocket endpoint: pushes zone risk updates on each simulator tick."""
    await manager.connect(websocket)
    try:
        gen = get_generator()
        risks = get_all_zone_risks()
        # Send current state immediately on connect
        await websocket.send_json({
            "type": "init",
            "tick": gen.tick,
            "sim_time": gen.sim_time_seconds,
            "alerts": risks,
            "running": get_sim_running(),
        })
        # Keep alive — server pushes on each tick
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                await websocket.send_json({"type": "keepalive"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
