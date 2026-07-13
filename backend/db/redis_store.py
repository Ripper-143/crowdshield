"""
Redis store for live zone risk scores in CrowdShield.
Provides O(1) access for WebSocket broadcast and dashboard polling.
Falls back to in-memory store when Redis is not available (local dev).
"""
import json
import os
import fnmatch
from typing import Dict, Optional
from datetime import datetime

REDIS_URL = os.getenv("REDIS_URL", "")
_redis_client = None


def get_redis():
    """Get Redis client with lazy initialization. Falls back to in-memory dict."""
    global _redis_client
    if _redis_client is None:
        if not REDIS_URL:
            _redis_client = _InMemoryStore()
            return _redis_client
        try:
            import redis
            client = redis.Redis.from_url(
                REDIS_URL,
                socket_timeout=1.0,
                socket_connect_timeout=1.0,
                decode_responses=True
            )
            client.ping()
            _redis_client = client
        except Exception:
            _redis_client = _InMemoryStore()
    return _redis_client


class _InMemoryStore:
    """Thread-safe fallback when Redis is unavailable (SQLite dev mode)."""
    def __init__(self):
        self._data: Dict[str, str] = {}

    def set(self, key: str, value: str, ex: int = None):
        self._data[key] = value

    def get(self, key: str) -> Optional[str]:
        return self._data.get(key)

    def keys(self, pattern: str = "*") -> list:
        return [k for k in self._data if fnmatch.fnmatch(k, pattern)]

    def mget(self, keys: list) -> list:
        return [self._data.get(k) for k in keys]

    def ping(self):
        return True


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------

def set_zone_risk(zone_id: str, risk_data: dict, ttl: int = 30):
    """
    Cache live risk score for a zone.
    TTL=30s: stale data auto-expires if sensor feed drops.
    """
    r = get_redis()
    key = f"risk:zone:{zone_id}"
    data = dict(risk_data)
    data["updated_at"] = datetime.utcnow().isoformat()
    r.set(key, json.dumps(data), ex=ttl)


def get_zone_risk(zone_id: str) -> Optional[dict]:
    """Get current risk score for a zone from cache."""
    r = get_redis()
    raw = r.get(f"risk:zone:{zone_id}")
    return json.loads(raw) if raw else None


def get_all_zone_risks() -> Dict[str, dict]:
    """Get risk scores for all zones from cache."""
    r = get_redis()
    keys = r.keys("risk:zone:*")
    if not keys:
        return {}
    values = r.mget(keys)
    result = {}
    for key, val in zip(keys, values):
        if val:
            zone_id = key.replace("risk:zone:", "")
            result[zone_id] = json.loads(val)
    return result


def set_sim_running(running: bool):
    r = get_redis()
    r.set("sim:running", "1" if running else "0")


def get_sim_running() -> bool:
    r = get_redis()
    val = r.get("sim:running")
    return val == "1"
