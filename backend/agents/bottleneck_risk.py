"""
Bottleneck Risk Agent — Stage 3 of the CrowdShield pipeline.

Classifies zone risk using Fruin's Level-of-Service (LoS) thresholds.

Fruin's LoS is the industry-standard crowd density classification system used
by crowd-safety engineers worldwide. It maps pedestrian density (people/m²) to
service quality levels A (free) through F (crush-imminent).

Source: Fruin, J.J. (1971). Pedestrian Planning and Design.
Metropolitan Association of Urban Designers and Environmental Planners.
ISBN: 0-918502-00-4
"""
from typing import Dict, Tuple, List

# Fruin Level-of-Service thresholds
# Format: (level, min_density, max_density, base_score, label)
FRUIN_LEVELS: List[Tuple] = [
    ("A", 0.0,  0.54,  0,   "Free Flow"),
    ("B", 0.54, 0.93,  20,  "Reasonably Free"),
    ("C", 0.93, 1.54,  40,  "Stable Flow"),
    ("D", 1.54, 3.86,  60,  "Constrained"),
    ("E", 3.86, 5.4,   80,  "Critical"),
    ("F", 5.4,  12.0,  100, "Crush Imminent"),
]

LEVELS_ORDER = ["A", "B", "C", "D", "E", "F"]

# Rate-of-change escalation: rapidly filling zones are more dangerous
# than density alone suggests. If density increasing faster than 0.5 p/m²/tick,
# escalate one Fruin level (conservative safety margin).
ROC_ESCALATION_THRESHOLD = 0.5   # p/m² per tick

# Zone-type risk multipliers: bottlenecks and exits pose higher
# injury risk at equivalent density (directional flow compression)
ZONE_RISK_MULTIPLIER: Dict[str, float] = {
    "entry":        1.0,
    "congregation": 1.0,
    "bottleneck":   1.4,   # narrow passage → higher crush force
    "exit":         1.2,   # choke point → backlog risk
}


def classify_fruin(density: float) -> Tuple[str, str, int]:
    """
    Map density to Fruin Level-of-Service.

    Args:
        density: Current density in people/m²

    Returns:
        (level, label, base_risk_score)
    """
    for level, lo, hi, score, label in FRUIN_LEVELS:
        if lo <= density < hi:
            return level, label, score
    # Above all thresholds — maximum risk
    return "F", "Crush Imminent", 100


def compute_risk_score(
    density: float,
    trend: float,
    zone_type: str,
    forecast_density: float,
) -> Tuple[str, int, str]:
    """
    Compute risk level, score (0–100), and rationale for a zone.

    Three factors:
    1. Base: Fruin LoS from current density
    2. Rate escalation: rapidly increasing density → bump one level
    3. Zone multiplier: bottlenecks score higher at same density

    Args:
        density: Current density (people/m²)
        trend: Density change per tick (positive = filling)
        zone_type: Zone classification affecting risk multiplier
        forecast_density: Predicted density in FORECAST_HORIZON_TICKS ticks

    Returns:
        (fruin_level, risk_score_0_100, rationale_string)
    """
    level, label, base_score = classify_fruin(density)
    rationale = f"Density {density:.2f} p/m² → Fruin LoS {level}: {label}"

    # Rate-of-change escalation
    if trend > ROC_ESCALATION_THRESHOLD and level != "F":
        idx = LEVELS_ORDER.index(level)
        level = LEVELS_ORDER[idx + 1]
        _, _, _, base_score, escalated_label = FRUIN_LEVELS[idx + 1]
        rationale += (
            f" | Escalated: rapid fill rate +{trend:.2f} p/m²/tick "
            f"→ LoS {level}: {escalated_label}"
        )

    # Zone-type multiplier
    multiplier = ZONE_RISK_MULTIPLIER.get(zone_type, 1.0)
    adjusted_score = min(100, int(base_score * multiplier))

    # Forecast-based warning
    fc_level, fc_label, _ = classify_fruin(forecast_density)
    fc_idx = LEVELS_ORDER.index(fc_level)
    curr_idx = LEVELS_ORDER.index(level)
    if fc_idx > curr_idx:
        rationale += (
            f" | Forecast {forecast_density:.2f} p/m² → "
            f"LoS {fc_level} ({fc_label}) in ~5min"
        )

    return level, adjusted_score, rationale


def bottleneck_risk_agent(state: dict) -> dict:
    """
    Bottleneck Risk Agent: applies Fruin LoS thresholds + trend analysis
    to classify risk per zone, flagging zones approaching crush conditions.

    Input: validated_readings, forecasts
    Output adds: risk_classifications (per zone)
    """
    validated: Dict[str, dict] = state.get("validated_readings", {})
    forecasts: Dict[str, dict] = state.get("forecasts", {})
    risk_classifications = {}

    for zone_id, stats in validated.items():
        density = stats["density"]
        zone_type = stats.get("zone_type", "congregation")
        fc = forecasts.get(zone_id, {})
        trend = fc.get("trend", 0.0)
        forecast_density = fc.get("forecast_density", density)
        tte = fc.get("time_to_f_level_seconds")

        fruin_level, risk_score, rationale = compute_risk_score(
            density, trend, zone_type, forecast_density
        )

        risk_classifications[zone_id] = {
            "fruin_level": fruin_level,
            "risk_score": risk_score,
            "rationale": rationale,
            "density": density,
            "trend": trend,
            "forecast_density": forecast_density,
            "time_to_f_level_seconds": tte,
            "zone_type": zone_type,
        }

    return {**state, "risk_classifications": risk_classifications}
