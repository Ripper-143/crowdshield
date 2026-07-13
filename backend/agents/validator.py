"""
Validator Agent — Stage 4 of the CrowdShield pipeline.

Cross-checks physical plausibility of risk classifications before alert generation.
Catches model errors (e.g., runaway trend causing implausible forecasts)
and ensures no physically impossible risk scores reach the control room.

This agent is not paranoia — real crowd-flow models can produce numerical
instabilities, and downstream decision-makers need to trust the outputs.
"""
from typing import Dict, Tuple

# Physical limits
MAX_PHYSICAL_DENSITY = 10.0   # theoretical max human packing (p/m²)
MAX_PLAUSIBLE_FORECAST_DELTA = 5.0  # max density change over 10 ticks
FALLBACK_LEVEL = "D"           # conservative level when validation fails
FALLBACK_SCORE = 60


def validate_risk(
    zone_id: str, risk: dict, stats: dict
) -> Tuple[bool, str]:
    """
    Validate a risk classification for physical plausibility.

    Checks:
    1. Density ≤ physical maximum (10/m²)
    2. Forecast cannot be dramatically higher than current + trend
    3. LoS F should not appear at density < 4.0 (rate artefact)
    """
    density = risk.get("density", 0.0)
    forecast = risk.get("forecast_density", 0.0)
    level = risk.get("fruin_level", "A")

    # Check 1: physical density limit
    if density > MAX_PHYSICAL_DENSITY:
        return False, f"Density {density:.2f} > physical max {MAX_PHYSICAL_DENSITY}/m²"

    # Check 2: forecast plausibility
    max_plausible = density + MAX_PLAUSIBLE_FORECAST_DELTA
    if forecast > max_plausible:
        return False, (
            f"Forecast {forecast:.2f} implausibly high vs "
            f"current {density:.2f} + delta {MAX_PLAUSIBLE_FORECAST_DELTA}"
        )

    # Check 3: LoS F at low density (rate-of-change artefact)
    if level == "F" and density < 4.0:
        return False, (
            f"LoS F flagged but density only {density:.2f}/m² "
            f"— likely transient rate-of-change artefact"
        )

    return True, "valid"


def validator_agent(state: dict) -> dict:
    """
    Validator Agent: filters out physically implausible risk scores.

    Invalid scores are downgraded to LoS D (conservative fallback)
    rather than dropped, ensuring every zone always has a risk score.

    Input: risk_classifications, validated_readings
    Output: updates risk_classifications (with capped invalid ones),
            adds validation_errors list
    """
    risk_classifications: Dict[str, dict] = state.get("risk_classifications", {})
    validated_readings: Dict[str, dict] = state.get("validated_readings", {})

    clean_risks = {}
    validation_errors = []

    for zone_id, risk in risk_classifications.items():
        stats = validated_readings.get(zone_id, {})
        valid, reason = validate_risk(zone_id, risk, stats)

        if valid:
            clean_risks[zone_id] = risk
        else:
            validation_errors.append({"zone_id": zone_id, "error": reason})
            # Downgrade to conservative fallback — don't drop the zone
            capped = dict(risk)
            capped["fruin_level"] = FALLBACK_LEVEL
            capped["risk_score"] = FALLBACK_SCORE
            capped["rationale"] += f" [VALIDATOR: capped — {reason}]"
            clean_risks[zone_id] = capped

    return {
        **state,
        "risk_classifications": clean_risks,
        "validation_errors": validation_errors,
    }
