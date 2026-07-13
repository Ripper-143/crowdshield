"""
LangGraph multi-agent pipeline for CrowdShield.

Pipeline: Perception → Flow Prediction → Bottleneck Risk → Validator → Alert/Control

Why multi-agent (not a single function)?
Each node has genuinely distinct expertise:
- Perception: sensor validation (hardware domain)
- Flow Prediction: time-series forecasting (statistics domain)
- Bottleneck Risk: domain-rule application (crowd-safety engineering)
- Validator: physics-based sanity checking (physical modeling)
- Alert/Control: human-factors action generation (operations domain)

Separating these enables independent testing, replacement, and future
parallelization (e.g., running prediction and risk in parallel for multiple zones).
"""
from typing import TypedDict, Dict, List, Optional, Any
from langgraph.graph import StateGraph, END

from .perception import perception_agent
from .flow_prediction import flow_prediction_agent
from .bottleneck_risk import bottleneck_risk_agent
from .validator import validator_agent
from .alert_control import alert_control_agent


class CrowdShieldState(TypedDict, total=False):
    """Shared state passed between pipeline agents."""
    # Stage 0: Input
    raw_zone_stats: Dict[str, dict]
    sim_time: float

    # Stage 1: Perception output
    validated_readings: Dict[str, dict]
    rejected_zones: List[dict]
    perception_ts: str
    total_agents: int

    # Stage 2: Flow prediction output
    forecasts: Dict[str, dict]

    # Stage 3: Risk classification output
    risk_classifications: Dict[str, dict]

    # Stage 4: Validation output
    validation_errors: List[dict]

    # Stage 5: Alert output
    alerts: Dict[str, dict]
    high_priority_alerts: List[dict]
    overall_severity: str


def build_pipeline() -> Any:
    """
    Compile the CrowdShield LangGraph StateGraph.

    Linear topology:
    perception → flow_prediction → bottleneck_risk → validator → alert_control → END
    """
    graph = StateGraph(CrowdShieldState)

    # Register nodes
    graph.add_node("perception", perception_agent)
    graph.add_node("flow_prediction", flow_prediction_agent)
    graph.add_node("bottleneck_risk", bottleneck_risk_agent)
    graph.add_node("validator", validator_agent)
    graph.add_node("alert_control", alert_control_agent)

    # Linear edges
    graph.set_entry_point("perception")
    graph.add_edge("perception", "flow_prediction")
    graph.add_edge("flow_prediction", "bottleneck_risk")
    graph.add_edge("bottleneck_risk", "validator")
    graph.add_edge("validator", "alert_control")
    graph.add_edge("alert_control", END)

    return graph.compile()


# Compile once at module import — reused across all requests
_pipeline: Optional[Any] = None


def get_pipeline() -> Any:
    global _pipeline
    if _pipeline is None:
        _pipeline = build_pipeline()
    return _pipeline


def run_pipeline(raw_zone_stats: dict, sim_time: float = 0.0) -> dict:
    """
    Run the full 5-agent pipeline on one tick of simulator output.

    Args:
        raw_zone_stats: Dict[zone_id -> density stats] from SFM simulator
        sim_time: Current simulation time in seconds

    Returns:
        Final state dict containing alerts, risk_classifications, forecasts, etc.
    """
    pipeline = get_pipeline()
    result = pipeline.invoke({
        "raw_zone_stats": raw_zone_stats,
        "sim_time": sim_time,
    })
    return result
