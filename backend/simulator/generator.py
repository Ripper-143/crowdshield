"""
Crowd scenario generator for CrowdShield.
Produces a deterministic crush-escalation scenario for reliable demo.

SEED=42 scenario timeline:
  Ticks   0-60   (0-30s):   Calm — LoS B-C
  Ticks  60-120  (30-60s):  Building surge — LoS C-D
  Ticks 120-200  (60-100s): Heavy surge — Bridge hits LoS E
  Ticks 200+     (100s+):   Critical — Bridge hits LoS F
"""
import asyncio
from typing import Dict, Callable, Awaitable
from .sfm import SocialForceModel


def get_entry_rates(tick: int) -> tuple:
    """
    Return (gate_a_rate, gate_b_rate) agents per tick based on scenario phase.
    Tick = 0.5s each → 120 ticks = 60 seconds.
    """
    if tick < 60:
        return (3, 2)       # Calm: normal attendance flow
    elif tick < 120:
        return (6, 4)       # Building: crowd arriving
    elif tick < 200:
        return (10, 7)      # Surge: peak event activity
    else:
        return (14, 9)      # Critical: overcrowding begins


class ScenarioGenerator:
    """Manages the SFM simulation and emits per-zone stats each tick."""

    def __init__(self, seed: int = 42):
        self.model = SocialForceModel(seed=seed)
        self.tick = 0
        self.running = False
        self._seed = seed

    def step(self) -> Dict[str, dict]:
        """Advance one tick and return zone stats."""
        rate_a, rate_b = get_entry_rates(self.tick)
        stats = self.model.step(entry_rate_a=rate_a, entry_rate_b=rate_b)
        self.tick += 1
        return stats

    def reset(self, seed: int = 42):
        """Reset simulation to t=0."""
        self._seed = seed
        self.model = SocialForceModel(seed=seed)
        self.tick = 0
        self.running = False

    @property
    def sim_time_seconds(self) -> float:
        return self.model.time

    @property
    def total_agents(self) -> int:
        return len(self.model.agents)

    async def run_loop(
        self,
        callback: Callable[[Dict[str, dict], float], Awaitable[None]],
        interval: float = 1.0
    ):
        """Run simulation loop, calling async callback with stats each tick."""
        self.running = True
        while self.running:
            stats = self.step()
            await callback(stats, self.sim_time_seconds)
            await asyncio.sleep(interval)

    def stop(self):
        self.running = False


# Global singleton generator — shared across all API requests
_generator = ScenarioGenerator(seed=42)


def get_generator() -> ScenarioGenerator:
    """Get the global simulator instance."""
    return _generator
