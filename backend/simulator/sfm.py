"""
Social Force Model (SFM) for crowd simulation in CrowdShield.

Based on: Helbing, D., & Molnár, P. (1995). Social force model for pedestrian dynamics.
Physical Review E, 51(5), 4282. https://doi.org/10.1103/PhysRevE.51.4282

Generates realistic crowd density time-series data for the agent pipeline.
Agents (people) experience:
  1. Desired velocity force — push toward goal
  2. Agent-agent repulsion — exponential, prevents overlap
  3. Wall repulsion — exponential, from venue boundaries
  4. Gaussian noise — naturalistic variation
"""
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from .venue import Zone, Wall, VENUE, ZONE_MAP


@dataclass
class Agent:
    """A pedestrian agent in the crowd simulation."""
    id: int
    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    desired_speed: float = 1.34   # m/s, Weidmann (1993)
    goal_x: float = 40.0          # current waypoint x
    goal_y: float = 17.0          # current waypoint y
    radius: float = 0.25           # m (shoulder width / 2)
    active: bool = True
    current_zone_id: Optional[str] = None
    reached_bridge: bool = False   # waypoint tracking


class SocialForceModel:
    """
    Simplified Social Force Model for crowd-crush risk simulation.

    SFM parameters calibrated to match real pedestrian dynamics:
    - TAU: relaxation time (how quickly agents reach desired velocity)
    - A, B: repulsion magnitude and decay range
    """

    # SFM parameters (Helbing & Molnár 1995)
    TAU = 0.5          # relaxation time (s)
    A_AGENT = 2000.0   # agent-agent repulsion magnitude (N)
    B_AGENT = 0.08     # agent-agent repulsion range (m)
    A_WALL  = 2000.0   # wall repulsion magnitude (N)
    B_WALL  = 0.08     # wall repulsion range (m)
    NOISE_STD = 0.1    # Gaussian noise on acceleration (m/s²)
    MAX_SPEED = 3.0    # hard speed cap (m/s)
    MAX_FORCE = 25.0   # hard force cap for numerical stability
    DT = 0.5           # timestep (s) — Euler integration

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)
        self.agents: List[Agent] = []
        self.next_id = 0
        self.time = 0.0
        self.venue = VENUE
        self._prev_zone_counts: Dict[str, int] = {z: 0 for z in ZONE_MAP}

    # ------------------------------------------------------------------
    # Agent spawning
    # ------------------------------------------------------------------

    def spawn_agent(self, gate_id: str = "gate_a") -> Agent:
        """Spawn a new agent at an entry gate with randomized parameters."""
        gate = ZONE_MAP[gate_id]
        x = self.rng.uniform(gate.x + 0.6, gate.x + gate.width - 0.6)
        y = self.rng.uniform(gate.y + 0.3, gate.y + gate.height * 0.4)
        speed = float(np.clip(self.rng.normal(1.34, 0.26), 0.5, 2.5))

        agent = Agent(
            id=self.next_id,
            x=x, y=y,
            desired_speed=speed,
            goal_x=41.0,   # head toward bridge
            goal_y=17.0,
        )
        if gate_id == "gate_b":
            agent.goal_x = 41.0
            agent.goal_y = 17.0

        self.next_id += 1
        return agent

    # ------------------------------------------------------------------
    # Force computation
    # ------------------------------------------------------------------

    def _desired_force(self, agent: Agent) -> np.ndarray:
        """Drive agent toward their current goal."""
        dx = agent.goal_x - agent.x
        dy = agent.goal_y - agent.y
        dist = np.sqrt(dx**2 + dy**2)

        if dist < 1.0:
            # Reached waypoint — advance to next goal
            if not agent.reached_bridge:
                agent.reached_bridge = True
                agent.goal_x = 35.0
                agent.goal_y = 34.0   # toward exit
            else:
                agent.goal_x = 35.0
                agent.goal_y = 42.0   # final exit
                if dist < 0.5:
                    agent.active = False
                    return np.zeros(2)

            dx = agent.goal_x - agent.x
            dy = agent.goal_y - agent.y
            dist = np.sqrt(dx**2 + dy**2)
            if dist < 1e-6:
                return np.zeros(2)

        ex, ey = dx / dist, dy / dist
        # Acceleration toward desired velocity
        fx = (agent.desired_speed * ex - agent.vx) / self.TAU
        fy = (agent.desired_speed * ey - agent.vy) / self.TAU
        return np.array([fx, fy])

    def _agent_repulsion(self, agent: Agent, neighbors: List[Agent]) -> np.ndarray:
        """Exponential repulsion from nearby agents."""
        fx, fy = 0.0, 0.0
        for other in neighbors:
            dx = agent.x - other.x
            dy = agent.y - other.y
            dist = float(np.sqrt(dx**2 + dy**2))
            if dist < 1e-6:
                angle = self.rng.uniform(0, 2 * np.pi)
                dx, dy = np.cos(angle), np.sin(angle)
                dist = 1e-6
            min_dist = agent.radius + other.radius
            mag = self.A_AGENT * np.exp((min_dist - dist) / self.B_AGENT)
            mag = min(mag, self.MAX_FORCE)
            fx += mag * dx / dist
            fy += mag * dy / dist
        return np.array([fx, fy])

    def _wall_repulsion(self, agent: Agent) -> np.ndarray:
        """Exponential repulsion from venue walls and boundaries."""
        fx, fy = 0.0, 0.0
        margin = agent.radius + 0.05

        # Custom wall segments
        for wall in self.venue["walls"]:
            normal, dist = wall.normal_and_distance(agent.x, agent.y)
            if dist < 2.0:
                mag = self.A_WALL * np.exp((margin - dist) / self.B_WALL)
                mag = min(mag, self.MAX_FORCE)
                fx += mag * normal[0]
                fy += mag * normal[1]

        # Venue boundary box
        W, H = self.venue["width"], self.venue["height"]
        for d, (nfx, nfy) in [
            (agent.x,       (1.0, 0.0)),
            (W - agent.x,  (-1.0, 0.0)),
            (agent.y,       (0.0, 1.0)),
            (H - agent.y,  (0.0, -1.0)),
        ]:
            if d < 2.0:
                mag = min(self.A_WALL * np.exp((margin - d) / self.B_WALL), self.MAX_FORCE)
                fx += mag * nfx
                fy += mag * nfy

        return np.array([fx, fy])

    def _get_neighbors(self, agent: Agent, radius: float = 2.5) -> List[Agent]:
        """Return active agents within spatial radius."""
        return [
            a for a in self.agents
            if a.id != agent.id and a.active
            and abs(a.x - agent.x) < radius and abs(a.y - agent.y) < radius
            and np.sqrt((a.x - agent.x)**2 + (a.y - agent.y)**2) < radius
        ]

    def _find_zone(self, agent: Agent) -> Optional[str]:
        """Find which zone the agent currently occupies."""
        for zone in self.venue["zones"]:
            if zone.contains(agent.x, agent.y):
                return zone.id
        return None

    # ------------------------------------------------------------------
    # Simulation step
    # ------------------------------------------------------------------

    def step(self, entry_rate_a: int = 5, entry_rate_b: int = 3) -> Dict[str, dict]:
        """
        Advance simulation by one timestep (DT seconds).

        Args:
            entry_rate_a: New agents to spawn at Gate-A this tick
            entry_rate_b: New agents to spawn at Gate-B this tick

        Returns:
            Dict[zone_id, stats] with density, count, flow rates per zone
        """
        # Spawn new entrants
        for _ in range(entry_rate_a):
            self.agents.append(self.spawn_agent("gate_a"))
        for _ in range(entry_rate_b):
            self.agents.append(self.spawn_agent("gate_b"))

        active = [a for a in self.agents if a.active]

        # Compute and apply forces
        for agent in active:
            neighbors = self._get_neighbors(agent)
            f_des = self._desired_force(agent)
            f_rep = self._agent_repulsion(agent, neighbors)
            f_wall = self._wall_repulsion(agent)
            noise = self.rng.normal(0, self.NOISE_STD, 2)

            ax = float(np.clip(f_des[0] + f_rep[0] + f_wall[0] + noise[0], -self.MAX_FORCE, self.MAX_FORCE))
            ay = float(np.clip(f_des[1] + f_rep[1] + f_wall[1] + noise[1], -self.MAX_FORCE, self.MAX_FORCE))

            # Euler integration
            agent.vx = float(np.clip(agent.vx + ax * self.DT, -self.MAX_SPEED, self.MAX_SPEED))
            agent.vy = float(np.clip(agent.vy + ay * self.DT, -self.MAX_SPEED, self.MAX_SPEED))
            agent.x += agent.vx * self.DT
            agent.y += agent.vy * self.DT

            # Clamp to venue bounds
            agent.x = float(np.clip(agent.x, 0.3, self.venue["width"] - 0.3))
            agent.y = float(np.clip(agent.y, 0.3, self.venue["height"] - 0.3))

            agent.current_zone_id = self._find_zone(agent)

        # Prune inactive (exited) agents
        self.agents = [a for a in self.agents if a.active]
        self.time += self.DT

        return self._compute_zone_stats()

    def _compute_zone_stats(self) -> Dict[str, dict]:
        """Aggregate per-zone density and flow statistics."""
        zone_agents: Dict[str, List[Agent]] = {z: [] for z in ZONE_MAP}
        for a in self.agents:
            if a.active and a.current_zone_id:
                zone_agents[a.current_zone_id].append(a)

        stats = {}
        for zone_id, zone in ZONE_MAP.items():
            agents_here = zone_agents[zone_id]
            count = len(agents_here)
            density_true = count / max(zone.area_m2, 1.0)

            # Simulate sensor measurement noise (camera/lidar jitter)
            noise_sigma = 0.02 * max(density_true, 0.1)
            density_noisy = max(0.0, density_true + self.rng.normal(0, noise_sigma))
            density_noisy = min(density_noisy, 12.0)  # physical cap

            prev = self._prev_zone_counts.get(zone_id, 0)
            delta = count - prev
            inflow = max(0.0, delta / self.DT * 60)   # people/min
            outflow = max(0.0, -delta / self.DT * 60)

            speeds = [np.sqrt(a.vx**2 + a.vy**2) for a in agents_here]
            avg_speed = float(np.mean(speeds)) if speeds else 0.0

            stats[zone_id] = {
                "people_count": count,
                "density": round(float(density_noisy), 4),
                "inflow_rate": round(inflow, 2),
                "outflow_rate": round(outflow, 2),
                "avg_speed": round(avg_speed, 3),
                "area_m2": zone.area_m2,
                "zone_name": zone.name,
                "zone_type": zone.zone_type,
            }
            self._prev_zone_counts[zone_id] = count

        return stats
