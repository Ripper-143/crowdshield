"""Tests for Fruin LoS risk classification."""
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

from backend.agents.bottleneck_risk import (
    classify_fruin, compute_risk_score, LEVELS_ORDER
)


def test_fruin_level_a():
    level, label, score = classify_fruin(0.3)
    assert level == "A"
    assert score == 0
    assert "Free" in label


def test_fruin_level_b():
    level, label, score = classify_fruin(0.7)
    assert level == "B"


def test_fruin_level_c():
    level, label, score = classify_fruin(1.2)
    assert level == "C"
    assert score == 40


def test_fruin_level_d():
    level, label, score = classify_fruin(2.5)
    assert level == "D"


def test_fruin_level_e():
    level, label, score = classify_fruin(4.5)
    assert level == "E"
    assert score == 80


def test_fruin_level_f():
    level, label, score = classify_fruin(6.0)
    assert level == "F"
    assert score == 100


def test_fruin_above_max():
    level, label, score = classify_fruin(15.0)
    assert level == "F"
    assert score == 100


def test_density_boundary_d_to_e():
    level_below, _, _ = classify_fruin(3.85)
    level_above, _, _ = classify_fruin(3.87)
    assert level_below == "D"
    assert level_above == "E"


def test_density_boundary_e_to_f():
    level_below, _, _ = classify_fruin(5.39)
    level_above, _, _ = classify_fruin(5.41)
    assert level_below == "E"
    assert level_above == "F"


def test_roc_escalation_escalates_level():
    """High rate-of-change should escalate Fruin level by one."""
    level_no_roc, score_no_roc, _ = compute_risk_score(1.2, 0.0, "congregation", 1.2)
    level_with_roc, score_with_roc, _ = compute_risk_score(1.2, 1.0, "congregation", 1.2)
    # With high trend, should escalate at least one level
    assert LEVELS_ORDER.index(level_with_roc) > LEVELS_ORDER.index(level_no_roc)


def test_bottleneck_multiplier_higher_score():
    """Bottleneck zones should score higher than congregation at same density."""
    _, score_cong, _ = compute_risk_score(3.0, 0.0, "congregation", 3.0)
    _, score_bottleneck, _ = compute_risk_score(3.0, 0.0, "bottleneck", 3.0)
    assert score_bottleneck > score_cong


def test_score_capped_at_100():
    """Risk score should never exceed 100."""
    _, score, _ = compute_risk_score(10.0, 5.0, "bottleneck", 12.0)
    assert score <= 100


def test_score_nonnegative():
    """Risk score should never be negative."""
    _, score, _ = compute_risk_score(0.0, 0.0, "congregation", 0.0)
    assert score >= 0
