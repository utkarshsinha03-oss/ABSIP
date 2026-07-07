"""
ABSIP — Threat Level Definitions
Member 2: Intelligence Lead — Phase 5
"""

# ─────────────────────────────────────────────
# THREAT LEVEL THRESHOLDS
# ─────────────────────────────────────────────

THREAT_LEVELS = [
    (81, 100, "Critical"),
    (61, 80,  "High"),
    (31, 60,  "Medium"),
    (0,  30,  "Safe"),
]

# ─────────────────────────────────────────────
# SCORING RULES (easy to modify)
# ─────────────────────────────────────────────

EVENT_SCORES = {
    "human_detected":   50,
    "vehicle_detected": 40,
    "drone_detected":   35,
    "motion_detected":  20,
    "thermal_anomaly":  25,
    "radar_contact":    30,
}

VISIBILITY_SCORES = {
    "Low":    20,
    "Medium": 10,
    "High":   0,
}

WEATHER_SCORES = {
    "Fog":        10,
    "Storm":      10,
    "Dust Storm": 10,
    "Rain":        5,
    "Snow":        5,
    "Clear":       0,
}

# Historical risk (1–10) multiplier — adds this many points per risk point
HISTORICAL_RISK_MULTIPLIER = 2

# Patrol gap multiplier — adds this many points per hour beyond threshold
PATROL_GAP_MULTIPLIER = 3
PATROL_GAP_THRESHOLD_HOURS = 2  # gaps beyond 2 hours start adding score


def get_threat_level(score: int) -> str:
    """
    Convert a numeric score (0–100) to a threat level label.

    Args:
        score (int): Threat score between 0 and 100.

    Returns:
        str: 'Safe', 'Medium', 'High', or 'Critical'
    """
    for low, high, level in THREAT_LEVELS:
        if low <= score <= high:
            return level
    return "Safe"