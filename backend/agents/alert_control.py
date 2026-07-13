"""
Alert/Control Agent — Stage 5 (final) of the CrowdShield pipeline.

Generates structured control-room alerts and recommended actions.
Translates risk classifications into human-readable, immediately actionable
instructions for event control rooms.
"""
from typing import Dict, List, Optional
from datetime import datetime

# Severity thresholds (risk_score 0–100)
WATCH_THRESHOLD    = 40   # LoS C → pre-position staff
WARNING_THRESHOLD  = 60   # LoS D → active management
CRITICAL_THRESHOLD = 80   # LoS E → intervention
EVACUATE_THRESHOLD = 100  # LoS F → evacuation

# Action playbook: zone_type x fruin_level → recommended action string
# Based on crowd-safety management protocols
ACTION_PLAYBOOK: Dict[str, Dict[str, str]] = {
    "bottleneck": {
        "C": "Increase crowd management staff visibility at bridge. Monitor flow rate.",
        "D": "Reduce inflow from Gate-A and Gate-B by 30%. Deploy staff to bridge entrance.",
        "E": "URGENT: Reduce Gate-A/B inflow by 60%. Staff to bridge. Announce slow movement on PA.",
        "F": "EMERGENCY: Close Gate-A and Gate-B. Activate PA announcement. Deploy all staff to bridge. Alert emergency services. Begin controlled evacuation.",
    },
    "entry": {
        "C": "Monitor queue length. Prepare backup entry channels.",
        "D": "Throttle entry rate. Queue management staff to gate.",
        "E": "Hold new entrants. Partial closure of gate.",
        "F": "CLOSE GATE. No new entrants. Redirect crowd to alternate routes.",
    },
    "congregation": {
        "C": "Monitor trend. Pre-position staff at exits.",
        "D": "Open additional exits. Guide crowd toward less congested zones.",
        "E": "Activate crowd redistribution. Open all exits. Staff to area immediately.",
        "F": "EMERGENCY: Activate evacuation protocol for this zone. All staff respond.",
    },
    "exit": {
        "C": "Clear any blockages at exit. Staff to guide flow.",
        "D": "Increase exit throughput. Remove barriers if present.",
        "E": "Priority: widen exit if possible. Staff to prevent backlog.",
        "F": "CRITICAL EXIT CRUSH RISK: Emergency response required immediately.",
    },
}

DEFAULT_ACTIONS: Dict[str, str] = {
    "A": "Situation normal. Continue standard monitoring.",
    "B": "Normal flow. No intervention required.",
    "C": "Monitor density trend. Pre-position crowd management resources.",
    "D": "Increased monitoring. Prepare crowd management resources for deployment.",
    "E": "Active intervention required. Reduce inflow to this zone immediately.",
    "F": "EMERGENCY: Crush-imminent conditions. Activate full emergency response protocol.",
}

FRUIN_COLORS: Dict[str, str] = {
    "A": "#22c55e",
    "B": "#84cc16",
    "C": "#eab308",
    "D": "#f97316",
    "E": "#ef4444",
    "F": "#dc2626",
}


def generate_alert(zone_id: str, zone_name: str, risk: dict) -> dict:
    """Generate a structured alert dict for a zone."""
    level = risk["fruin_level"]
    score = risk["risk_score"]
    density = risk["density"]
    forecast = risk["forecast_density"]
    tte = risk.get("time_to_f_level_seconds")
    zone_type = risk.get("zone_type", "congregation")

    # Determine severity label
    if score >= EVACUATE_THRESHOLD:
        severity = "EVACUATE"
    elif score >= CRITICAL_THRESHOLD:
        severity = "CRITICAL"
    elif score >= WARNING_THRESHOLD:
        severity = "WARNING"
    elif score >= WATCH_THRESHOLD:
        severity = "WATCH"
    else:
        severity = "NORMAL"

    color = FRUIN_COLORS.get(level, "#22c55e")

    # Get recommended action from playbook
    action = (
        ACTION_PLAYBOOK.get(zone_type, {}).get(level)
        or DEFAULT_ACTIONS.get(level, "Monitor zone.")
    )

    # Format time-to-critical
    ttc_str: Optional[str] = None
    if tte is not None and tte > 0:
        mins = int(tte // 60)
        secs = int(tte % 60)
        ttc_str = f"{mins}m {secs}s" if mins > 0 else f"{secs}s"

    return {
        "zone_id": zone_id,
        "zone_name": zone_name,
        "fruin_level": level,
        "risk_score": score,
        "severity": severity,
        "color": color,
        "density": density,
        "forecast_density": forecast,
        "time_to_critical": ttc_str,
        "alert_message": (
            f"[{severity}] {zone_name} — "
            f"LoS {level}: density {density:.2f}/m², "
            f"forecast {forecast:.2f}/m²"
        ),
        "recommended_action": action,
        "generated_at": datetime.utcnow().isoformat(),
    }


def alert_control_agent(state: dict) -> dict:
    """
    Alert/Control Agent: generates structured alerts and control-room
    action recommendations for all zones, ordered by risk severity.

    Input: risk_classifications, validated_readings
    Output adds: alerts (per zone), high_priority_alerts (sorted list), overall_severity
    """
    risk_classifications: Dict[str, dict] = state.get("risk_classifications", {})
    validated: Dict[str, dict] = state.get("validated_readings", {})

    alerts = {}
    high_priority_alerts = []

    for zone_id, risk in risk_classifications.items():
        zone_name = validated.get(zone_id, {}).get("zone_name", zone_id)
        alert = generate_alert(zone_id, zone_name, risk)
        alerts[zone_id] = alert

        if alert["risk_score"] >= WARNING_THRESHOLD:
            high_priority_alerts.append(alert)

    # Sort by risk score descending for control-room priority queue
    high_priority_alerts.sort(key=lambda a: a["risk_score"], reverse=True)

    overall = (
        high_priority_alerts[0]["severity"]
        if high_priority_alerts
        else "NORMAL"
    )

    return {
        **state,
        "alerts": alerts,
        "high_priority_alerts": high_priority_alerts,
        "overall_severity": overall,
    }
