"""
Venue layout definition for CrowdShield simulator.
Models a Kumbh Mela ghat section — representative of Indian mass-gathering venues.
"""
from dataclasses import dataclass, field
from typing import List, Tuple, Dict
import numpy as np


@dataclass
class Wall:
    """A line segment wall/barrier in the venue."""
    x1: float
    y1: float
    x2: float
    y2: float

    def normal_and_distance(self, px: float, py: float) -> Tuple[np.ndarray, float]:
        """Return unit normal from wall to point and perpendicular distance."""
        dx = self.x2 - self.x1
        dy = self.y2 - self.y1
        length = np.sqrt(dx**2 + dy**2)
        if length < 1e-9:
            return np.array([0.0, 1.0]), 1e9
        # Normal vector (perpendicular to wall)
        nx, ny = -dy / length, dx / length
        # Signed distance from point to line
        dist = abs(nx * (px - self.x1) + ny * (py - self.y1))
        return np.array([nx, ny]), dist


@dataclass
class Zone:
    """A spatial zone in the venue for density monitoring."""
    id: str
    name: str
    zone_type: str  # 'entry', 'congregation', 'bottleneck', 'exit'
    x: float        # bounding box origin
    y: float
    width: float
    height: float
    gate_width: float = 0.0   # 0 = no dedicated gate
    capacity: int = 0
    goal_x: float = 35.0      # waypoint agents in this zone move toward
    goal_y: float = 42.0

    @property
    def area_m2(self) -> float:
        return self.width * self.height

    def contains(self, px: float, py: float) -> bool:
        return (self.x <= px <= self.x + self.width and
                self.y <= py <= self.y + self.height)

    @property
    def center(self) -> Tuple[float, float]:
        return (self.x + self.width / 2, self.y + self.height / 2)


def build_venue() -> Dict:
    """
    Build the Kumbh Mela ghat section venue layout.

    Coordinate system (meters, top-left origin, y increases downward):
    - Total area: 70m wide × 42m tall
    - Two entry gates at top, congregation areas in middle,
      bridge bottleneck connecting plazas, exit at bottom.
    """
    zones = [
        Zone(
            id="gate_a", name="Gate A (Main Entry)", zone_type="entry",
            x=0, y=0, width=10, height=8,
            gate_width=4.0, capacity=200,
            goal_x=20, goal_y=18
        ),
        Zone(
            id="gate_b", name="Gate B (Side Entry)", zone_type="entry",
            x=60, y=0, width=10, height=8,
            gate_width=3.0, capacity=150,
            goal_x=55, goal_y=18
        ),
        Zone(
            id="plaza_1", name="Plaza 1 (Main Congregation)", zone_type="congregation",
            x=0, y=8, width=40, height=20,
            capacity=4800,
            goal_x=39, goal_y=17
        ),
        Zone(
            id="plaza_2", name="Plaza 2 (Ghat Area)", zone_type="congregation",
            x=42, y=8, width=28, height=20,
            capacity=3600,
            goal_x=35, goal_y=30
        ),
        Zone(
            id="bridge", name="Ghat Bridge (Bottleneck)", zone_type="bottleneck",
            x=40, y=14, width=2, height=6,
            gate_width=2.0, capacity=80,
            goal_x=57, goal_y=18
        ),
        Zone(
            id="exit", name="Exit Gate", zone_type="exit",
            x=25, y=30, width=20, height=8,
            gate_width=2.5, capacity=200,
            goal_x=35, goal_y=42
        ),
    ]

    # Venue boundary walls (line segments)
    walls = [
        Wall(0, 0, 70, 0),      # top boundary
        Wall(0, 0, 0, 38),      # left boundary
        Wall(70, 0, 70, 38),    # right boundary
        Wall(0, 38, 25, 38),    # bottom-left (exit sides)
        Wall(45, 38, 70, 38),   # bottom-right
        # Bridge passage walls (narrow 2m corridor)
        Wall(40, 8, 40, 14),    # left side approach
        Wall(42, 8, 42, 14),    # right side approach
        Wall(40, 20, 40, 28),   # left side exit
        Wall(42, 20, 42, 28),   # right side exit
    ]

    return {"zones": zones, "walls": walls, "width": 70, "height": 42}


# Global venue instance
VENUE = build_venue()
ZONE_MAP: Dict[str, Zone] = {z.id: z for z in VENUE["zones"]}
