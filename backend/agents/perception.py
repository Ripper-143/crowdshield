"""
Perception Agent — Stage 1 of the CrowdShield pipeline.

Validates and ingests raw density readings from the simulator.
Filters physically impossible values before downstream processing.
Rationale: perception is distinct from prediction/classification —
separating it catches sensor errors early, before they corrupt forecasts.
"""
from datetime import datetime
from typing import Dict, Tuple


def validate_reading(zone_id: str, stats: dict) -> Tuple[bool, str]:
    """
    Validate a single zone reading for physical plausibility.

    Rules:
    - Density must be non-negative
    - Density cannot exceed physical maximum (~12 p/m²)
    - People count must be non-negative
    - Count/area cross-check (within 1.5 p/m² tolerance for sensor noise)
    """
    density = stats.get("density", -1)
    count = stats.get("people_count", -1)
    area = stats.get("area_m2", 1.0)

    if density < 0:
        return False, f"Negative density {density:.3f} in zone {zone_id}"
    if density > 12.0:
        return False, f"Density {density:.2f} exceeds physical max (12/m²) in {zone_id}"
    if count < 0:
        return False, f"Negative people count ({count}) in {zone_id}"

    # Cross-validate count vs density
    implied = count / max(area, 1.0)
    if abs(implied - density) > 1.5:
        return (False,
                f"Count/density mismatch in {zone_id}: "
                f"{count}/{area:.0f}m²={implied:.2f} vs measured {density:.2f}")

    return True, "ok"


def perception_agent(state: dict) -> dict:
    """
    Perception Agent: validates raw simulator output.

    Filters out physically impossible values before they reach the
    flow prediction and risk classification stages.

    Input state keys: raw_zone_stats, sim_time
    Output adds: validated_readings, rejected_zones, perception_ts, total_agents
    """
    raw_stats: Dict[str, dict] = state.get("raw_zone_stats", {})

    validated = {}
    rejected = []
    total_agents = 0

    for zone_id, stats in raw_stats.items():
        valid, reason = validate_reading(zone_id, stats)
        if valid:
            validated[zone_id] = stats
            total_agents += stats.get("people_count", 0)
        else:
            rejected.append({"zone_id": zone_id, "reason": reason})

    return {
        **state,
        "validated_readings": validated,
        "rejected_zones": rejected,
        "perception_ts": datetime.utcnow().isoformat(),
        "total_agents": total_agents,
    }
