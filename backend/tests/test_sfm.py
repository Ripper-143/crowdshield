"""Tests for Social Force Model simulator."""
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from backend.simulator.sfm import SocialForceModel
from backend.simulator.venue import ZONE_MAP


def test_sfm_init():
    model = SocialForceModel(seed=42)
    assert len(model.agents) == 0
    assert model.time == 0.0
    assert model.tick == 0 if hasattr(model, 'tick') else True


def test_step_returns_all_zones():
    model = SocialForceModel(seed=42)
    stats = model.step(entry_rate_a=5, entry_rate_b=3)
    assert isinstance(stats, dict)
    assert len(stats) == len(ZONE_MAP)
    for zone_id in ZONE_MAP:
        assert zone_id in stats


def test_density_nonnegative_over_30_steps():
    model = SocialForceModel(seed=42)
    for i in range(30):
        stats = model.step(entry_rate_a=8, entry_rate_b=5)
        for zone_id, s in stats.items():
            assert s["density"] >= 0, f"Negative density {s['density']} in {zone_id} at step {i}"


def test_density_below_physical_max():
    """Density must never exceed hard physical limit."""
    model = SocialForceModel(seed=42)
    for i in range(50):
        stats = model.step(entry_rate_a=20, entry_rate_b=15)
        for zone_id, s in stats.items():
            assert s["density"] <= 12.0, (
                f"Density {s['density']} exceeds 12/m² in {zone_id} at step {i}"
            )


def test_people_count_nonnegative():
    model = SocialForceModel(seed=42)
    for _ in range(10):
        stats = model.step(entry_rate_a=5, entry_rate_b=3)
        for zone_id, s in stats.items():
            assert s["people_count"] >= 0


def test_time_advances():
    model = SocialForceModel(seed=42)
    t0 = model.time
    model.step(entry_rate_a=5, entry_rate_b=3)
    assert model.time > t0


def test_deterministic_output():
    """Same seed must produce identical results."""
    m1 = SocialForceModel(seed=42)
    m2 = SocialForceModel(seed=42)
    s1 = m1.step(entry_rate_a=5, entry_rate_b=3)
    s2 = m2.step(entry_rate_a=5, entry_rate_b=3)
    for zone_id in s1:
        assert abs(s1[zone_id]["density"] - s2[zone_id]["density"]) < 1e-6, (
            f"Non-deterministic output in {zone_id}"
        )


def test_agents_accumulate():
    """More agents should spawn as simulation progresses."""
    model = SocialForceModel(seed=42)
    stats1 = model.step(entry_rate_a=10, entry_rate_b=5)
    count1 = sum(s["people_count"] for s in stats1.values())
    for _ in range(5):
        model.step(entry_rate_a=10, entry_rate_b=5)
    stats2 = {zid: s for zid, s in model.step(entry_rate_a=10, entry_rate_b=5).items()}
    count2 = sum(s["people_count"] for s in stats2.values())
    assert count2 >= count1  # crowd should grow (some may exit but net positive)


def test_zone_stats_have_required_fields():
    model = SocialForceModel(seed=42)
    stats = model.step(entry_rate_a=5, entry_rate_b=3)
    required = ["people_count", "density", "inflow_rate", "outflow_rate", "area_m2", "zone_name"]
    for zone_id, s in stats.items():
        for field in required:
            assert field in s, f"Missing field '{field}' in zone {zone_id}"
